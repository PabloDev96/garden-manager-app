import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  IoClose,
  IoGridOutline,
  IoTrashOutline,
  IoAddOutline,
  IoArrowBackOutline,
  IoLeafOutline,
  IoWaterOutline,
  IoBasketOutline,
  IoScaleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5';
import { GiPlantSeed } from "react-icons/gi";

import HoverTooltip from './HoverTooltip';
import useCellSize from '../utils/calculateCellSize';
import useGridSelection from "../utils/useGridSelection";

// Use cases
import addCropUseCase from '../services/gardens/addCropUseCase';
import removeCropUseCase from '../services/gardens/removeCropUseCase';
import addHarvestUseCase from '../services/gardens/addHarvestUseCase';
import getPlotHarvestsUseCase from '../services/gardens/getPlotHarvestUseCase';
import getGardenTotalsUseCase from '../services/gardens/getGardenTotalUseCase';
import { CROPS_DATABASE } from '../utils/cropsDatabase';

/** Mini-modal auto-cierre (estilo confirmación, pero sin botones) CON ANIMACIONES */
const AutoNoticeModal = ({ notice }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);

  useEffect(() => {
    if (notice) {
      setCurrentNotice(notice);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setCurrentNotice(null), 300);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  if (!currentNotice) return null;

  const isDanger = currentNotice.variant === 'danger';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div
        className={`w-full max-w-sm bg-white rounded-2xl border-2 shadow-xl p-5 text-center transform transition-all duration-300 ease-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'
          } ${isDanger ? 'border-red-200' : 'border-[#CEB5A7]/40'}`}
      >
        <h4 className="text-lg font-bold text-[#5B7B7A]">{currentNotice.title}</h4>
        {currentNotice.message && (
          <p className="text-sm text-[#A17C6B] mt-2">{currentNotice.message}</p>
        )}
      </div>
    </div>
  );
};

const GardenView = ({ uid, garden, onClose, onUpdate, onDelete, onTotalsUpdate }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [savingCell, setSavingCell] = useState(false);
  const [gardenTotals, setGardenTotals] = useState({ totalUnits: 0, totalGrams: 0 });

  // ====== NOTIFICACIONES (auto-cierre) ======
  const [notice, setNotice] = useState(null); // { title, message, variant }
  const notify = (data, ms = 2500) => {
    setNotice(data);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setNotice(null), ms);
  };

  // ====== CONFIRM ELIMINAR HUERTO ======
  const [showDeleteGardenConfirm, setShowDeleteGardenConfirm] = useState(false);
  const [deletingGarden, setDeletingGarden] = useState(false);

  // ====== PLANTAR TODO / ELIMINAR TODO ======
  const [showPlantAllModal, setShowPlantAllModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [processingBulk, setProcessingBulk] = useState(false);

  // ====== SELECCIÓN POR ARRASTRE ======
  const gridWrapRef = useRef(null);
  const {
    selectedCells,
    isSelecting,
    justDragged,
    overlayStyle,
    cellRefs,
    keyOf,
    handlers,
    clearSelection,
    wasDragRef,
  } = useGridSelection({ gridWrapRef });

  const confirmDeleteGarden = async () => {
    try {
      setDeletingGarden(true);
      await onDelete(garden.id);

      setShowDeleteGardenConfirm(false);

      notify(
        {
          variant: 'danger',
          title: 'Huerto eliminado',
          message: 'Se ha eliminado correctamente',
        },
        2300
      );
    } catch (e) {
      console.error(e);
      notify(
        {
          variant: 'danger',
          title: 'Error',
          message: 'No se pudo eliminar el huerto',
        },
        2600
      );
    } finally {
      setDeletingGarden(false);
    }
  };

  // ---- PLANTAR TODO ----
  const handlePlantAll = async (plantData) => {
    if (!uid || !garden) return;

    try {
      setProcessingBulk(true);
      let plantedCount = 0;

      for (let row = 0; row < garden.grid.rows; row++) {
        for (let col = 0; col < garden.grid.columns; col++) {
          const currentPlant = garden.plants[row]?.[col];
          if (!currentPlant) {
            const plantId = `${Date.now()}_${row}_${col}_${Math.random().toString(16).slice(2)}`;
            const newPlant = {
              ...plantData,
              id: plantId,
            };
            await addCropUseCase(uid, garden.id, row, col, newPlant);
            plantedCount++;
          }
        }
      }

      setShowPlantAllModal(false);

      notify(
        {
          variant: 'success',
          title: 'Plantación completada',
          message: `${plantedCount} parcelas plantadas`,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify(
        {
          variant: 'danger',
          title: 'Error',
          message: 'No se pudo completar la plantación',
        },
        2600
      );
    } finally {
      setProcessingBulk(false);
    }
  };

  // ---- ELIMINAR TODO ----
  const handleDeleteAll = async (deleteHistory = false) => {
    if (!uid || !garden) return;

    try {
      setProcessingBulk(true);
      let deletedCount = 0;
      let totalRemovedUnits = 0;
      let totalRemovedGrams = 0;

      for (let row = 0; row < garden.grid.rows; row++) {
        for (let col = 0; col < garden.grid.columns; col++) {
          const currentPlant = garden.plants[row]?.[col];
          if (currentPlant) {
            const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(
              uid,
              garden.id,
              row,
              col,
              { deleteHistory }
            );
            totalRemovedUnits += removedUnits;
            totalRemovedGrams += removedGrams;
            deletedCount++;
          }
        }
      }

      // ✅ SOLO actualizar totales si se borró historial
      if (deleteHistory) {
        setGardenTotals((prev) => ({
          totalUnits: Math.max(0, (prev.totalUnits || 0) - totalRemovedUnits),
          totalGrams: Math.max(0, (prev.totalGrams || 0) - totalRemovedGrams),
        }));
      }

      setShowDeleteAllConfirm(false);
      clearSelection();

      // ✅ opcional pero recomendado: refrescar datos del huerto
      await onUpdate();

      notify(
        {
          variant: 'danger',
          title: 'Eliminación completada',
          message: `${deletedCount} cultivos eliminados`,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify(
        {
          variant: 'danger',
          title: 'Error',
          message: 'No se pudo completar la eliminación',
        },
        2600
      );
    } finally {
      setProcessingBulk(false);
    }
  };

  // ====== ACCIONES EN CELDAS SELECCIONADAS ======
  const [showPlantSelectedModal, setShowPlantSelectedModal] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingPlantData, setPendingPlantData] = useState(null);
  const [overwriteStats, setOverwriteStats] = useState({ occupied: 0, empty: 0 });

  // ---- PLANTAR EN CELDAS SELECCIONADAS ----
  const handlePlantSelected = async (plantData) => {
    if (!uid || !garden || selectedCells.size === 0) return;

    // Contar celdas vacías y ocupadas
    let emptyCount = 0;
    let occupiedCount = 0;

    for (const cellKey of selectedCells) {
      const [rowStr, colStr] = cellKey.split('-');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);
      const currentPlant = garden.plants[row]?.[col];

      if (currentPlant) {
        occupiedCount++;
      } else {
        emptyCount++;
      }
    }

    // Si hay celdas ocupadas, pedir confirmación
    if (occupiedCount > 0) {
      setPendingPlantData(plantData);
      setOverwriteStats({ occupied: occupiedCount, empty: emptyCount });
      setShowPlantSelectedModal(false);
      setShowOverwriteConfirm(true);
      return;
    }

    // Si todas están vacías, plantar directamente
    await executePlantSelected(plantData, false);
  };

  // ---- EJECUTAR PLANTACIÓN (con o sin sobrescritura) ----
  const executePlantSelected = async (plantData, deleteHistory = false) => {
    if (!uid || !garden || selectedCells.size === 0) return;

    try {
      setProcessingBulk(true);
      let plantedCount = 0;
      let overwrittenCount = 0;
      let totalRemovedUnits = 0;
      let totalRemovedGrams = 0;

      for (const cellKey of selectedCells) {
        const [rowStr, colStr] = cellKey.split('-');
        const row = parseInt(rowStr, 10);
        const col = parseInt(colStr, 10);
        const currentPlant = garden.plants[row]?.[col];

        if (currentPlant) {
          // Sobrescribir: primero eliminar, luego plantar
          const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(
            uid,
            garden.id,
            row,
            col,
            { deleteHistory }
          );
          totalRemovedUnits += removedUnits;
          totalRemovedGrams += removedGrams;

          await addCropUseCase(uid, garden.id, row, col, plantData);
          overwrittenCount++;
        } else {
          await addCropUseCase(uid, garden.id, row, col, plantData);
          plantedCount++;
        }
      }

      // ✅ SOLO actualizar totales si se borró historial en sobrescrituras
      if (deleteHistory && overwrittenCount > 0) {
        setGardenTotals((prev) => ({
          totalUnits: Math.max(0, (prev.totalUnits || 0) - totalRemovedUnits),
          totalGrams: Math.max(0, (prev.totalGrams || 0) - totalRemovedGrams),
        }));
      }

      setShowPlantSelectedModal(false);
      setShowOverwriteConfirm(false);
      setPendingPlantData(null);
      clearSelection();
      await onUpdate();

      const message =
        overwrittenCount > 0
          ? `${plantedCount} nuevas, ${overwrittenCount} sobrescritas`
          : `${plantedCount} parcelas plantadas`;

      notify(
        {
          variant: 'success',
          title: 'Plantación completada',
          message,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify(
        {
          variant: 'danger',
          title: 'Error',
          message: 'No se pudo completar la plantación',
        },
        2600
      );
    } finally {
      setProcessingBulk(false);
    }
  };

  // ---- ELIMINAR CELDAS SELECCIONADAS ----
  const handleDeleteSelected = async (deleteHistory = false) => {
    if (!uid || !garden || selectedCells.size === 0) return;

    try {
      setProcessingBulk(true);
      let deletedCount = 0;
      let totalRemovedUnits = 0;
      let totalRemovedGrams = 0;

      for (const cellKey of selectedCells) {
        const [rowStr, colStr] = cellKey.split('-');
        const row = parseInt(rowStr, 10);
        const col = parseInt(colStr, 10);
        const currentPlant = garden.plants[row]?.[col];

        if (currentPlant) {
          const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(
            uid,
            garden.id,
            row,
            col,
            { deleteHistory }
          );
          totalRemovedUnits += removedUnits;
          totalRemovedGrams += removedGrams;
          deletedCount++;
        }
      }

      // ✅ SOLO actualizar totales si se borró historial
      if (deleteHistory) {
        setGardenTotals((prev) => ({
          totalUnits: Math.max(0, (prev.totalUnits || 0) - totalRemovedUnits),
          totalGrams: Math.max(0, (prev.totalGrams || 0) - totalRemovedGrams),
        }));
      }

      setShowDeleteSelectedConfirm(false);
      clearSelection();

      await onUpdate();

      notify(
        {
          variant: 'danger',
          title: 'Eliminación completada',
          message: `${deletedCount} cultivos eliminados`,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify(
        {
          variant: 'danger',
          title: 'Error',
          message: 'No se pudo completar la eliminación',
        },
        2600
      );
    } finally {
      setProcessingBulk(false);
    }
  };

  // ---- 1) Cargar totales del huerto ----
  useEffect(() => {
    if (!uid || !garden?.id) return;

    const loadTotals = async () => {
      try {
        const totals = await getGardenTotalsUseCase(uid, garden.id);
        setGardenTotals(totals);
      } catch (error) {
        console.error('Error loading garden totals:', error);
      }
    };

    loadTotals();
  }, [uid, garden?.id]);

  // ---- 2) Sincronizar Dashboard cuando gardenTotals cambie ----
  useEffect(() => {
    if (!garden?.id) return;
    onTotalsUpdate?.(garden.id, gardenTotals);
  }, [garden?.id, gardenTotals?.totalUnits, gardenTotals?.totalGrams]);

  // ---- 3) handleHarvest ----
  const handleHarvest = async (harvestInfo) => {
    if (!uid || !selectedCell) return;

    try {
      setSavingCell(true);

      await addHarvestUseCase(uid, garden.id, selectedCell.row, selectedCell.col, harvestInfo);

      setGardenTotals((prev) => ({
        totalUnits: Math.max(0, (prev.totalUnits || 0) + (harvestInfo.units || 0)),
        totalGrams: Math.max(0, (prev.totalGrams || 0) + (harvestInfo.totalGrams || 0)),
      }));

      setShowPlantModal(false);
      setSelectedCell(null);

      notify(
        {
          variant: 'success',
          title: 'Recolectado',
          message: `${harvestInfo.units} unidades${harvestInfo.totalGrams ? ` · ${Math.round(harvestInfo.totalGrams)}g` : ''
            }`,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify({ variant: 'danger', title: 'Error', message: 'No se pudo registrar la cosecha.' }, 2600);
    } finally {
      setSavingCell(false);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // Limpiar cualquier selección previa
    if (selectedCells.size > 0) {
      clearSelection();
    }

    // Abrir modal
    setSelectedCell({ row: rowIndex, col: colIndex });
    setShowPlantModal(true);
  };

  const handleAddPlant = async (plantData, meta) => {
    if (!uid || !selectedCell) return;

    try {
      setSavingCell(true);

      await addCropUseCase(uid, garden.id, selectedCell.row, selectedCell.col, plantData);

      setShowPlantModal(false);
      setSelectedCell(null);

      const mode = meta?.mode; // "create" | "edit"
      const title =
        mode === 'create' ? 'Cultivo añadido' : mode === 'edit' ? 'Cultivo editado' : 'Cultivo guardado';

      notify(
        {
          variant: 'success',
          title,
          message: `${plantData?.emoji || '🌱'} ${plantData?.name || 'Cultivo'}`,
        },
        2300
      );
    } catch (e) {
      console.error(e);
      notify({ variant: 'danger', title: 'Error', message: 'No se pudo guardar la planta.' }, 2600);
    } finally {
      setSavingCell(false);
    }
  };

  const handleRemovePlant = async (options = {}) => {
    if (!uid || !selectedCell) return;

    try {
      setSavingCell(true);

      const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(
        uid,
        garden.id,
        selectedCell.row,
        selectedCell.col,
        options
      );

      // ✅ SOLO actualizar totales en UI si realmente borraste historial
      if (options?.deleteHistory) {
        setGardenTotals((prev) => ({
          totalUnits: Math.max(0, (prev.totalUnits || 0) - Math.max(0, removedUnits || 0)),
          totalGrams: Math.max(0, (prev.totalGrams || 0) - Math.max(0, removedGrams || 0)),
        }));
      }

      setShowPlantModal(false);
      setSelectedCell(null);

      // ✅ refrescar huerto para que se vea vacía la parcela
      await onUpdate();

      notify(
        options?.deleteHistory
          ? { variant: 'danger', title: 'Eliminado', message: 'Cultivo + historial borrados' }
          : { variant: 'danger', title: 'Cultivo eliminado', message: 'Historial conservado en BD' },
        2400
      );
    } catch (e) {
      console.error(e);
      notify({ variant: 'danger', title: 'Error', message: 'No se pudo eliminar la planta.' }, 2600);
    } finally {
      setSavingCell(false);
    }
  };

  const currentPlant = selectedCell ? garden.plants[selectedCell.row]?.[selectedCell.col] : null;

  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  const gapPx = 8;
  const { ref: gridRef, cellSize } = useCellSize({
    cols: garden.grid.columns,
    gapPx,
    preferred: isMobile ? 36 : 100,
    min: isMobile ? 14 : 18,
  });

  const emptyCells = garden.plants.flat().filter((p) => p === null).length;
  const plantedCells = garden.plants.flat().filter((p) => p !== null).length;

  return (
    <div className="fixed inset-0 bg-[#E0F2E9] z-50 overflow-y-auto">
      <AutoNoticeModal notice={notice} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#CEB5A7]/30 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center hover:shadow-xl transition-all cursor-pointer"
              >
                <IoArrowBackOutline className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#5B7B7A]">{garden.name}</h1>
                <p className="text-sm text-[#A17C6B]">
                  {garden.dimensions.width}m × {garden.dimensions.height}m | {garden.grid.columns}×{garden.grid.rows}{' '}
                  parcelas
                </p>
              </div>
            </div>

            <HoverTooltip label="Eliminar huerto" mode="auto" className="inline-flex">
              <button
                onClick={() => setShowDeleteGardenConfirm(true)}
                disabled={processingBulk}
                className="group flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium cursor-pointer"
              >
                <IoTrashOutline className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </HoverTooltip>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center min-h-[96px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IoGridOutline className="w-4 h-4" />
                <p className="text-xs opacity-90">Parcelas totales</p>
              </div>
              <p className="text-2xl font-bold">{garden.grid.rows * garden.grid.columns}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center min-h-[96px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IoLeafOutline className="w-4 h-4" />
                <p className="text-xs opacity-90">Plantadas</p>
              </div>
              <p className="text-2xl font-bold">{plantedCells}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center min-h-[96px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IoBasketOutline className="w-4 h-4" />
                <p className="text-xs opacity-90">Unidades cosechadas</p>
              </div>
              <p className="text-2xl font-bold">{gardenTotals.totalUnits}</p>
            </div>

            <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl p-4 text-white flex flex-col items-center justify-center text-center min-h-[96px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IoScaleOutline className="w-4 h-4" />
                <p className="text-xs opacity-90">Peso total</p>
              </div>

              {gardenTotals.totalGrams <= 0 ? (
                <p className="text-2xl font-bold">—</p>
              ) : gardenTotals.totalGrams < 1000 ? (
                <p className="text-2xl font-bold">{Math.round(gardenTotals.totalGrams)} g</p>
              ) : (
                <p className="text-2xl font-bold">{(gardenTotals.totalGrams / 1000).toFixed(1)} kg</p>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6 md:p-8">
            <div className="mb-6 flex flex-col items-center justify-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                {emptyCells > 0 && (
                  <button
                    onClick={() => setShowPlantAllModal(true)}
                    disabled={processingBulk}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <GiPlantSeed className="w-4 h-4" />
                    <span>Plantar todo</span>
                  </button>
                )}

                {plantedCells > 0 && (
                  <button
                    onClick={() => setShowDeleteAllConfirm(true)}
                    disabled={processingBulk}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                    <span>Eliminar todo</span>
                  </button>
                )}
              </div>

              {/* Mostrar botones de acciones en celdas seleccionadas */}
              {selectedCells.size > 0 && (
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-bold text-[#5B7B7A]">Selección: {selectedCells.size}</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-3 py-2 rounded-xl border-2 border-[#CEB5A7] text-[#5B7B7A] hover:bg-[#E0F2E9] font-bold text-sm"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Botones de acciones sobre la selección */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowPlantSelectedModal(true)}
                      disabled={processingBulk}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <GiPlantSeed className="w-4 h-4" />
                      <span>Plantar selección</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteSelectedConfirm(true)}
                      disabled={processingBulk}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                      <span>Eliminar selección</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedCells.size === 0 && (
                <p className="text-sm text-[#A17C6B] text-center">
                  Click en cada parcela para gestionarla (o arrastra para seleccionar varias)
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              {/* Wrapper de scroll: ocupa el ancho, pero NO captura el drag */}
              <div className="w-full flex justify-center">
                {/* Contenedor shrink-to-fit: SOLO mide lo que mide el grid */}
                <div
                  ref={gridWrapRef}
                  className="relative select-none"
                  style={{
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={handlers.onPointerDown}
                  onPointerMove={handlers.onPointerMove}
                  onPointerUp={handlers.onPointerUp}
                >
                  {/* Fondo del grid (aquí el BG) */}
                  <div className="rounded-2xl p-3 bg-[#E0F2E9] border-2 border-[#CEB5A7]/30">
                    <div
                      ref={gridRef}
                      className="grid"
                      style={{
                        gap: `${gapPx}px`,
                        gridTemplateColumns: `repeat(${garden.grid.columns}, ${cellSize}px)`,
                      }}
                    >
                      {garden.plants.map((row, rowIndex) =>
                        row.map((plant, colIndex) => {
                          const hasPlant = plant !== null;
                          const plantInfo =
                            hasPlant && plant.category && plant.type
                              ? CROPS_DATABASE[plant.category]?.types[plant.type]
                              : null;

                          const k = keyOf(rowIndex, colIndex);
                          const isSelected = selectedCells.has(k);

                          return (
                            <button
                              ref={(el) => {
                                cellRefs.current[k] = el;
                              }}
                              key={k}
                              onClick={(e) => {
                                if (wasDragRef.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }

                                // si hay selección múltiple, no abrir modal
                                if (selectedCells.size > 0) return;

                                handleCellClick(rowIndex, colIndex);
                              }}
                              disabled={savingCell || processingBulk}
                              className={`rounded-lg border-2 transition-all relative group
                    ${hasPlant
                                  ? 'border-2 hover:shadow-lg'
                                  : 'bg-[#CEB5A7] border-2 border-[#5B7B7A]/50 hover:border-4 hover:border-[#5B7B7A]'}
                    ${savingCell || processingBulk ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected ? 'ring-4 ring-[#5B7B7A]/40 border-[#5B7B7A]' : ''}
                  `}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                backgroundColor: plantInfo?.color || (hasPlant ? '#5B7B7A' : undefined),
                                borderColor: plantInfo?.color || (hasPlant ? '#5B7B7A' : undefined),
                              }}
                              title={`Parcela ${rowIndex}, ${colIndex}`}
                            >
                              {hasPlant ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                  {plantInfo ? (
                                    <>
                                      <span className="mb-0.5" style={{ fontSize: Math.min(cellSize * 0.5, 32) }}>
                                        {plantInfo.emoji}
                                      </span>
                                      <p
                                        className="text-white font-bold truncate w-full text-center leading-none drop-shadow-md"
                                        style={{ fontSize: Math.max(8, Math.min(10, Math.floor(cellSize / 4))) }}
                                      >
                                        {plantInfo.name}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <IoLeafOutline
                                        className="text-white mb-0.5"
                                        style={{
                                          width: Math.min(16, cellSize * 0.5),
                                          height: Math.min(16, cellSize * 0.5),
                                        }}
                                      />
                                      <p
                                        className="text-[10px] text-white font-bold truncate w-full text-center leading-none"
                                        style={{ fontSize: Math.max(8, Math.min(10, Math.floor(cellSize / 4))) }}
                                      >
                                        {plant.name}
                                      </p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <IoAddOutline
                                    className="text-[#5B7B7A]"
                                    style={{
                                      width: Math.min(18, cellSize * 0.6),
                                      height: Math.min(18, cellSize * 0.6),
                                    }}
                                  />
                                </div>
                              )}

                              <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-30">
                                {rowIndex},{colIndex}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Overlay del selector: relativo al contenedor shrink-to-fit */}
                  {isSelecting && overlayStyle && (
                    <div
                      className="absolute z-30 border-2 border-[#5B7B7A] bg-[#5B7B7A]/10 rounded-lg pointer-events-none"
                      style={overlayStyle}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Plant Modal */}
      {showPlantModal && (
        <PlantModal
          uid={uid}
          gardenId={garden.id}
          plant={currentPlant}
          position={selectedCell}
          saving={savingCell}
          notify={notify}
          onClose={() => {
            setShowPlantModal(false);
            setSelectedCell(null);
          }}
          onSave={(plantData, meta) => handleAddPlant(plantData, meta)}
          onRemove={currentPlant ? (opts) => handleRemovePlant(opts) : null}
          onHarvest={currentPlant ? handleHarvest : null}
        />
      )}

      {/* ✅ Modal Plantar Todo */}
      {showPlantAllModal && (
        <PlantAllModal
          onClose={() => setShowPlantAllModal(false)}
          onConfirm={handlePlantAll}
          processing={processingBulk}
          emptyCells={emptyCells}
        />
      )}

      {/* ✅ Modal Eliminar Todo */}
      {showDeleteAllConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteAllConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-[#5B7B7A]">Eliminar todos los cultivos</h4>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-2">
                Se eliminarán {plantedCells} cultivos. ¿Qué quieres hacer con el historial?
              </p>
            </div>

            <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleDeleteAll(false)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Eliminar cultivos
              </button>

              <button
                type="button"
                onClick={() => handleDeleteAll(true)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Eliminar cultivos + historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal Plantar Celdas Seleccionadas */}
      {showPlantSelectedModal && (
        <PlantAllModal
          onClose={() => setShowPlantSelectedModal(false)}
          onConfirm={handlePlantSelected}
          processing={processingBulk}
          emptyCells={selectedCells.size}
          title="Plantar en celdas seleccionadas"
          message={`Se plantarán las ${selectedCells.size} celdas vacías seleccionadas`}
        />
      )}

      {/* ✅ Modal Eliminar Celdas Seleccionadas */}
      {showDeleteSelectedConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteSelectedConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-[#5B7B7A]">Eliminar cultivos seleccionados</h4>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-2">
                Se eliminarán los cultivos de {selectedCells.size} parcelas. ¿Qué quieres hacer con el historial?
              </p>
            </div>

            <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSelected(false)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Eliminar cultivos
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSelected(true)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Eliminar cultivos + historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal Confirmar Sobrescritura */}
      {showOverwriteConfirm && pendingPlantData && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setShowOverwriteConfirm(false);
            setPendingPlantData(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-orange-300 shadow-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-orange-600">
                ⚠️ Sobrescribir cultivos existentes
              </h4>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-2">
                De las {selectedCells.size} celdas seleccionadas:
              </p>
              <div className="mt-2 text-sm font-bold">
                <p className="text-green-600">✓ {overwriteStats.empty} vacías (se plantarán)</p>
                <p className="text-orange-600">⚠ {overwriteStats.occupied} ocupadas (se sobrescribirán)</p>
              </div>
              <p className="text-xs text-[#A17C6B] mt-3">
                ¿Qué quieres hacer con el historial de las {overwriteStats.occupied} parcelas ocupadas?
              </p>
            </div>

            <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowOverwriteConfirm(false);
                  setPendingPlantData(null);
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => executePlantSelected(pendingPlantData, false)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Sobrescribir (mantener historial)
              </button>

              <button
                type="button"
                onClick={() => executePlantSelected(pendingPlantData, true)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={processingBulk}
              >
                Sobrescribir + borrar historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal confirmación eliminar huerto */}
      {showDeleteGardenConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteGardenConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h4 className="text-base sm:text-lg font-bold text-[#5B7B7A]">Eliminar huerto</h4>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-2">¿Seguro que quieres eliminar este huerto?</p>
            </div>

            <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteGardenConfirm(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={deletingGarden}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteGarden}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold text-sm sm:text-base cursor-pointer"
                disabled={deletingGarden}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== PlantAllModal =====================
const PlantAllModal = ({
  onClose,
  onConfirm,
  processing,
  emptyCells,
  title = "Plantar en todas las parcelas vacías",
  message = null
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    plantedDate: new Date().toISOString().split('T')[0],
    wateringDays: 3,
  });

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedType('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCategory || !selectedType) return;

    const plantInfo = CROPS_DATABASE[selectedCategory].types[selectedType];

    const plantData = {
      category: selectedCategory,
      type: selectedType,
      name: plantInfo.name,
      emoji: plantInfo.emoji,
      color: plantInfo.color,
      plantedDate: formData.plantedDate,
      wateringDays: formData.wateringDays,
    };

    onConfirm(plantData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-4 sm:p-6">
          <div className="relative flex items-start justify-between gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />

            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-[#5B7B7A]">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-[#A17C6B] mt-1">
                {message || `Se plantarán ${emptyCells} parcelas`}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={processing}
              className={`w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              aria-label="Cerrar"
            >
              <IoClose className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">Categoría</label>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm sm:text-base cursor-pointer"
              required
              disabled={processing}
            >
              <option value="">Selecciona una categoría</option>
              {Object.entries(CROPS_DATABASE).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.emoji} {data.label}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div className="animate-fadeIn">
              <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">
                Tipo de {CROPS_DATABASE[selectedCategory].label}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(CROPS_DATABASE[selectedCategory].types).map(([key, plantType]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedType(key)}
                    disabled={processing}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${selectedType === key
                        ? 'border-[#5B7B7A] bg-[#E0F2E9] shadow-md scale-105'
                        : 'border-[#CEB5A7]/50 hover:border-[#5B7B7A] hover:bg-[#E0F2E9]/30'
                      }
                      ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-4xl">{plantType.emoji}</span>
                      <span className="font-medium text-gray-800 text-xs sm:text-base">{plantType.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2">Fecha de plantación</label>
            <input
              type="date"
              value={formData.plantedDate}
              onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all cursor-pointer text-sm sm:text-base"
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2">
              <IoWaterOutline className="w-4 h-4 sm:w-5 sm:h-5" />
              Riego cada (días)
            </label>
            <input
              type="number"
              value={formData.wateringDays}
              onChange={(e) => setFormData({ ...formData, wateringDays: parseInt(e.target.value, 10) })}
              min="1"
              max="30"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all cursor-pointer text-sm sm:text-base"
              disabled={processing}
            />
          </div>
        </form>

        <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#CEB5A7]/30 p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold text-sm sm:text-base ${processing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={processing || !selectedCategory || !selectedType}
              className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm sm:text-base ${processing || !selectedCategory || !selectedType ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
              {processing ? 'Plantando...' : `Plantar ${emptyCells}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================== PlantModal =====================
const PlantModal = ({ uid, gardenId, plant, position, saving, onClose, onSave, onRemove, onHarvest, notify }) => {
  const defaultView = plant ? 'harvest' : 'edit';

  const [view, setView] = useState(defaultView);
  const [selectedCategory, setSelectedCategory] = useState(plant?.category || '');
  const [selectedType, setSelectedType] = useState(plant?.type || '');
  const [formData, setFormData] = useState({
    plantedDate: plant?.plantedDate || new Date().toISOString().split('T')[0],
    wateringDays: plant?.wateringDays || 3,
  });
  const [harvestData, setHarvestData] = useState({ units: '', gramsPerUnit: '', includeGrams: false });

  const [harvestHistory, setHarvestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activePlantId = useMemo(() => {
    if (plant?.id) return plant.id;
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }, [plant?.id, position?.row, position?.col]);

  useEffect(() => {
    const nextDefault = plant ? 'harvest' : 'edit';
    setView(nextDefault);

    setSelectedCategory(plant?.category || '');
    setSelectedType(plant?.type || '');
    setFormData({
      plantedDate: plant?.plantedDate || new Date().toISOString().split('T')[0],
      wateringDays: plant?.wateringDays || 3,
    });

    setHarvestData({ units: '', gramsPerUnit: '', includeGrams: false });
    setHarvestHistory([]);
    setShowHistoryDetails(false);
    setShowDeleteConfirm(false);
  }, [plant, position?.row, position?.col]);

  useEffect(() => {
    if (!uid || !gardenId || position === null) return;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);

        // ✅ Historial "por parcela": NO filtrar por plantId
        const history = await getPlotHarvestsUseCase(uid, gardenId, position.row, position.col);
        setHarvestHistory(history);
      } catch (error) {
        console.error('Error loading harvest history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [uid, gardenId, position?.row, position?.col]);

  const historyTotals = harvestHistory.reduce(
    (acc, h) => ({
      units: acc.units + (h.units || 0),
      grams: acc.grams + (h.totalGrams || 0),
    }),
    { units: 0, grams: 0 }
  );

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedType('');
  };

  const currentPlantInfo =
    plant && plant.category && plant.type
      ? CROPS_DATABASE[plant.category]?.types[plant.type]
      : selectedType && selectedCategory
        ? CROPS_DATABASE[selectedCategory]?.types[selectedType]
        : null;

  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (!selectedCategory || !selectedType) {
      notify?.({ variant: 'danger', title: 'Faltan datos', message: 'Selecciona categoría y tipo' }, 2200);
      return;
    }

    const plantInfo = CROPS_DATABASE[selectedCategory].types[selectedType];
    const isCreating = !plant;

    const plantData = {
      id: isCreating ? activePlantId : plant?.id,
      category: selectedCategory,
      type: selectedType,
      name: plantInfo.name,
      emoji: plantInfo.emoji,
      color: plantInfo.color,
      plantedDate: formData.plantedDate,
      wateringDays: formData.wateringDays,
    };

    onSave?.(plantData, { mode: isCreating ? 'create' : 'edit' });
  };

  const handleHarvestSubmit = async (e) => {
    e.preventDefault();

    if (!harvestData.units || Number(harvestData.units) <= 0) {
      notify?.({ variant: 'danger', title: 'Cantidad inválida', message: 'Introduce unidades válidas' }, 2200);
      return;
    }

    const units = parseInt(harvestData.units, 10);
    const gramsPerUnit =
      harvestData.includeGrams && harvestData.gramsPerUnit ? parseFloat(harvestData.gramsPerUnit) : null;
    const totalGrams = harvestData.includeGrams && gramsPerUnit ? units * gramsPerUnit : null;

    const harvestInfo = {
      units,
      gramsPerUnit,
      totalGrams,
      plantId: plant?.id,
      plantName: plant?.name,
      plantEmoji: plant?.emoji,
    };

    await onHarvest(harvestInfo);

    const history = await getPlotHarvestsUseCase(uid, gardenId, position.row, position.col);
    setHarvestHistory(history);

    setHarvestData({ units: '', gramsPerUnit: '', includeGrams: false });
    setShowHistoryDetails(false);
  };

  const confirmDelete = async (deleteHistory = false) => {
    try {
      setShowDeleteConfirm(false);
      await onRemove?.({ deleteHistory });

      notify?.(
        deleteHistory
          ? { variant: 'danger', title: 'Eliminado', message: 'Cultivo + historial borrados' }
          : { variant: 'danger', title: 'Cultivo eliminado', message: 'Historial conservado en BD' },
        2400
      );
    } catch (e) {
      console.error(e);
      notify?.({ variant: 'danger', title: 'Error', message: 'No se pudo eliminar' }, 2600);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-6 sticky top-0 z-20">
          <div className="relative flex items-start justify-between gap-4">
            <div className="w-10 h-10 shrink-0" />

            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-xl font-bold text-[#5B7B7A]">{plant ? 'Gestionar planta' : 'Añadir Planta'}</h3>
              <p className="text-sm text-[#A17C6B] truncate">
                Parcela [{position?.row}, {position?.col}]
                {plant && currentPlantInfo && ` - ${currentPlantInfo.emoji} ${currentPlantInfo.name}`}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={saving}
              className={`w-10 h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all ${saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              aria-label="Cerrar"
            >
              <IoClose className="w-5 h-5 text-[#5B7B7A]" />
            </button>
          </div>

          {plant && (
            <div className="mt-5">
              <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-1 flex">
                <button
                  type="button"
                  onClick={() => setView('harvest')}
                  disabled={saving}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'harvest'
                    ? 'bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow'
                    : 'text-[#5B7B7A] hover:bg-[#E0F2E9]'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Recolectar
                </button>

                <button
                  type="button"
                  onClick={() => setView('edit')}
                  disabled={saving}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${view === 'edit'
                    ? 'bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow'
                    : 'text-[#5B7B7A] hover:bg-[#E0F2E9]'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Editar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* VIEW HARVEST */}
          {view === 'harvest' && plant && (
            <form id="harvest-form" onSubmit={handleHarvestSubmit} className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-2 border-[#CEB5A7]/50 rounded-2xl p-4 sm:p-6">
                <div className="text-center mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-[#A17C6B]">
                    Plantado el {new Date(plant.plantedDate).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {loadingHistory ? (
                  <p className="text-center text-xs sm:text-sm text-[#A17C6B]">Cargando historial...</p>
                ) : harvestHistory.length > 0 ? (
                  <div className="border-t-2 border-[#CEB5A7]/30 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#5B7B7A]/20 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#5B7B7A]/10">
                            <IoBasketOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" />
                          </span>
                          <p className="text-[11px] sm:text-xs text-[#A17C6B]">Total recolectado</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">
                          {historyTotals.units}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">unidades</p>
                      </div>

                      {historyTotals.grams > 0 && (
                        <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#5B7B7A]/20 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#5B7B7A]/10">
                              <IoScaleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7B7A]" />
                            </span>
                            <p className="text-[11px] sm:text-xs text-[#A17C6B]">Peso total</p>
                          </div>

                          {historyTotals.grams < 1000 ? (
                            <>
                              <p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">
                                {Math.round(historyTotals.grams)}
                              </p>
                              <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">gramos</p>
                            </>
                          ) : (
                            <>
                              <p className="text-2xl sm:text-3xl font-bold text-[#5B7B7A] leading-none">
                                {(historyTotals.grams / 1000).toFixed(1)}
                              </p>
                              <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">kilogramos</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHistoryDetails(!showHistoryDetails)}
                      className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#5B7B7A]/10 hover:bg-[#5B7B7A]/20 rounded-xl transition-all font-medium text-[#5B7B7A] text-sm sm:text-base"
                    >
                      {showHistoryDetails ? (
                        <>
                          <IoChevronUpOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                          Ocultar detalles
                        </>
                      ) : (
                        <>
                          <IoChevronDownOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                          Ver más ({harvestHistory.length})
                        </>
                      )}
                    </button>

                    {showHistoryDetails && (
                      <div className="mt-3 sm:mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
                        {harvestHistory.map((harvest) => {
                          const date = harvest.harvestDate?.toDate?.() || new Date();
                          return (
                            <div key={harvest.id} className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#CEB5A7]/30">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-[#5B7B7A] text-sm sm:text-base">{harvest.units} unidades</p>
                                  <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">
                                    {date.toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>

                                {harvest.totalGrams && (
                                  <div className="text-right">
                                    <p className="font-bold text-[#5B7B7A] text-sm sm:text-base">
                                      {Math.round(harvest.totalGrams)}g
                                    </p>
                                    <p className="text-[11px] sm:text-xs text-[#A17C6B] mt-1">{harvest.gramsPerUnit}g/ud</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-xs sm:text-sm text-[#A17C6B]">Aún no hay cosechas registradas</p>
                )}
              </div>

              <div className="border-t-2 border-[#CEB5A7]/30 pt-6">
                <h4 className="text-lg font-bold text-[#5B7B7A] mb-4">Nueva Cosecha</h4>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2">
                    <IoBasketOutline className="w-5 h-5" />
                    Cantidad de unidades recolectadas
                  </label>
                  <input
                    type="number"
                    value={harvestData.units}
                    onChange={(e) => setHarvestData({ ...harvestData, units: e.target.value })}
                    min="1"
                    step="1"
                    required
                    placeholder="Ej: 15"
                    className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-lg font-medium"
                    disabled={saving}
                  />
                </div>

                <div className="bg-[#E0F2E9]/50 border-2 border-[#CEB5A7]/30 rounded-2xl p-4 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={harvestData.includeGrams}
                      onChange={(e) =>
                        setHarvestData({
                          ...harvestData,
                          includeGrams: e.target.checked,
                          gramsPerUnit: e.target.checked ? harvestData.gramsPerUnit : '',
                        })
                      }
                      className="w-5 h-5 rounded border-2 border-[#5B7B7A] text-[#5B7B7A] focus:ring-[#5B7B7A] cursor-pointer"
                      disabled={saving}
                    />
                    <div>
                      <span className="text-sm font-bold text-[#5B7B7A]">Especificar peso por unidad</span>
                      <p className="text-xs text-[#A17C6B]">Opcional: añade el peso en gramos de cada unidad</p>
                    </div>
                  </label>
                </div>

                {harvestData.includeGrams && (
                  <div className="animate-fadeIn mb-4">
                    <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2">
                      <IoScaleOutline className="w-5 h-5" />
                      Gramos por unidad
                    </label>
                    <input
                      type="number"
                      value={harvestData.gramsPerUnit}
                      onChange={(e) => setHarvestData({ ...harvestData, gramsPerUnit: e.target.value })}
                      min="0.1"
                      step="0.1"
                      placeholder="Ej: 150"
                      className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-lg font-medium"
                      disabled={saving}
                    />
                  </div>
                )}
              </div>

              <div className="h-24" />
            </form>
          )}

          {/* VIEW EDIT */}
          {view === 'edit' && (
            <form id="edit-form" onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-base cursor-pointer"
                  required
                  disabled={saving}
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.entries(CROPS_DATABASE).map(([key, data]) => (
                    <option key={key} value={key}>
                      {data.emoji} {data.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-[#5B7B7A] mb-2">
                    Tipo de {CROPS_DATABASE[selectedCategory].label}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CROPS_DATABASE[selectedCategory].types).map(([key, plantType]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedType(key)}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left
                          ${selectedType === key
                            ? 'border-[#5B7B7A] bg-[#E0F2E9] shadow-md scale-105'
                            : 'border-[#CEB5A7]/50 hover:border-[#5B7B7A] hover:bg-[#E0F2E9]/30'
                          }
                          ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{plantType.emoji}</span>
                          <span className="font-medium text-gray-800">{plantType.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Fecha de plantación</label>
                <input
                  type="date"
                  value={formData.plantedDate}
                  onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2 flex items-center gap-2">
                  <IoWaterOutline className="w-5 h-5" />
                  Riego cada (días)
                </label>
                <input
                  type="number"
                  value={formData.wateringDays}
                  onChange={(e) => setFormData({ ...formData, wateringDays: parseInt(e.target.value, 10) })}
                  min="1"
                  max="30"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                  disabled={saving}
                />
              </div>

              <div className="h-24" />
            </form>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#CEB5A7]/30 p-4">
          {view === 'harvest' && plant && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={`px-6 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="harvest-form"
                disabled={saving || !harvestData.units}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 ${saving || !harvestData.units ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                Registrar Cosecha
              </button>
            </div>
          )}

          {view === 'edit' && (
            <div className="flex gap-3">
              {onRemove && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  className={`px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  Eliminar
                </button>
              )}

              <button
                type="submit"
                form="edit-form"
                disabled={saving || !selectedCategory || !selectedType}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold ${saving || !selectedCategory || !selectedType ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                Guardar
              </button>
            </div>
          )}
        </div>

        {/* Mini modal confirmación eliminar (con 3 opciones) */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h4 className="text-lg font-bold text-[#5B7B7A]">Eliminar cultivo</h4>
                <p className="text-sm text-[#A17C6B] mt-2">¿Qué quieres hacer con este cultivo?</p>
                <p className="text-xs text-[#A17C6B] mt-2">
                  (Si mantienes el historial, no se borra nada de la base de datos)
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => confirmDelete(false)}
                  className="w-full px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold"
                  disabled={saving}
                >
                  Eliminar cultivo
                </button>

                <button
                  type="button"
                  onClick={() => confirmDelete(true)}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold"
                  disabled={saving}
                >
                  Eliminar cultivo + historial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GardenView;