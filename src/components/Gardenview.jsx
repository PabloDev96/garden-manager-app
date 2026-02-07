import React, { useState, useEffect, useMemo } from 'react';
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
  IoCheckmarkCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline
} from 'react-icons/io5';

import useCellSize from '../utils/calculateCellSize';

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
      // Nueva notificación entrando
      setCurrentNotice(notice);
      // Pequeño delay para activar la animación
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Notificación saliendo
      setIsVisible(false);
      // Esperar a que termine la animación antes de limpiar
      const timer = setTimeout(() => {
        setCurrentNotice(null);
      }, 300); // Duración del fade-out
      return () => clearTimeout(timer);
    }
  }, [notice]);

  if (!currentNotice) return null;

  const isDanger = currentNotice.variant === 'danger';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
      <div
        className={`w-full max-w-sm bg-white rounded-2xl border-2 shadow-xl p-5 text-center transform transition-all duration-300 ease-out ${isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-4'
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

  const confirmDeleteGarden = async () => {
    try {
      setDeletingGarden(true);
      await onDelete(garden.id);

      setShowDeleteGardenConfirm(false);

      notify(
        {
          variant: 'danger',
          title: 'Huerto eliminado 🗑️',
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

      // ✅ modal auto-cierre confirmación recolección
      notify(
        {
          variant: 'success',
          title: 'Recolectado ✅',
          message: `${harvestInfo.units} unidades${harvestInfo.totalGrams ? ` · ${Math.round(harvestInfo.totalGrams)}g` : ''
            }`,
        },
        2600
      );
    } catch (e) {
      console.error(e);
      notify(
        { variant: 'danger', title: 'Error', message: 'No se pudo registrar la cosecha.' },
        2600
      );
    } finally {
      setSavingCell(false);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
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
        mode === 'create'
          ? 'Cultivo añadido ✅'
          : mode === 'edit'
            ? 'Cultivo editado ✅'
            : 'Cultivo guardado ✅';

      // ✅ modal auto-cierre cultivo añadido / editado
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

      // removeCropUseCase devuelve { removedUnits, removedGrams }
      const { removedUnits = 0, removedGrams = 0 } = await removeCropUseCase(
        uid,
        garden.id,
        selectedCell.row,
        selectedCell.col,
        options // { deleteHistory: true/false }
      );

      setGardenTotals((prev) => ({
        totalUnits: Math.max(0, (prev.totalUnits || 0) - Math.max(0, removedUnits || 0)),
        totalGrams: Math.max(0, (prev.totalGrams || 0) - Math.max(0, removedGrams || 0)),
      }));

      setShowPlantModal(false);
      setSelectedCell(null);

      // ✅ modal auto-cierre confirmado
      notify(
        options?.deleteHistory
          ? { variant: 'danger', title: 'Eliminado 🗑️', message: 'Cultivo + historial borrados' }
          : { variant: 'danger', title: 'Cultivo eliminado 🗑️', message: 'Historial conservado en BD' },
        2400
      );
    } catch (e) {
      console.error(e);
      notify({ variant: 'danger', title: 'Error', message: 'No se pudo eliminar la planta.' }, 2600);
    } finally {
      setSavingCell(false);
    }
  };

  const currentPlant = selectedCell
    ? garden.plants[selectedCell.row]?.[selectedCell.col]
    : null;

  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  const gapPx = 8;
  const { ref: gridRef, cellSize } = useCellSize({
    cols: garden.grid.columns,
    gapPx,
    preferred: isMobile ? 36 : 100,
    min: isMobile ? 14 : 18,
  });

  return (
    <div className="fixed inset-0 bg-[#E0F2E9] z-50 overflow-y-auto">
      {/* ✅ Notificación auto-cierre global CON ANIMACIONES */}
      <AutoNoticeModal notice={notice} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#CEB5A7]/30 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center hover:shadow-xl transition-all"
              >
                <IoArrowBackOutline className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#5B7B7A]">{garden.name}</h1>
                <p className="text-sm text-[#A17C6B]">
                  {garden.dimensions.width}m × {garden.dimensions.height}m |{' '}
                  {garden.grid.columns}×{garden.grid.rows} parcelas
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteGardenConfirm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-medium"
            >
              <IoTrashOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Eliminar Huerto</span>
            </button>
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
              <p className="text-2xl font-bold">{garden.plants.flat().filter(p => p !== null).length}</p>
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
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#5B7B7A] flex items-center gap-2">
                <IoGridOutline className="w-6 h-6" />
                Cuadrícula del Huerto
              </h2>
              <p className="text-sm text-[#A17C6B]">Click en una parcela para gestionarla</p>
            </div>

            <div className="overflow-x-auto">
              <div
                ref={gridRef}
                className="grid min-w-fit mx-auto"
                style={{
                  gap: `${gapPx}px`,
                  gridTemplateColumns: `repeat(${garden.grid.columns}, ${cellSize}px)`,
                  justifyContent: 'center',
                }}
              >
                {garden.plants.map((row, rowIndex) =>
                  row.map((plant, colIndex) => {
                    const hasPlant = plant !== null;
                    const plantInfo =
                      hasPlant && plant.category && plant.type
                        ? CROPS_DATABASE[plant.category]?.types[plant.type]
                        : null;

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        disabled={savingCell}
                        className={`rounded-lg border-2 transition-all relative group ${hasPlant
                          ? 'border-2 hover:shadow-lg'
                          : 'bg-[#CEB5A7] border-2 border-[#5B7B7A]/50 hover:border-4 hover:border-[#5B7B7A]'
                          } ${savingCell ? 'opacity-60 cursor-not-allowed' : ''}`}
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
          notify={notify} // ✅ para modales auto-cierre desde dentro
          onClose={() => {
            setShowPlantModal(false);
            setSelectedCell(null);
          }}
          onSave={(plantData, meta) => handleAddPlant(plantData, meta)}
          onRemove={currentPlant ? (opts) => handleRemovePlant(opts) : null}
          onHarvest={currentPlant ? handleHarvest : null}
        />
      )}

      {/* ✅ Modal confirmación eliminar huerto */}
      {showDeleteGardenConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDeleteGardenConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h4 className="text-lg font-bold text-[#5B7B7A]">Eliminar huerto</h4>
              <p className="text-sm text-[#A17C6B] mt-2">
                ¿Seguro que quieres eliminar este huerto?
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteGardenConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold"
                disabled={deletingGarden}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteGarden}
                className="flex-1 px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold"
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

  // confirm eliminar cultivo
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ NUEVO: plantId "activo" del cultivo (para que al crear uno nuevo NO herede cosechas)
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

  // Historial filtrado por plantId (NO hereda cosechas)
  useEffect(() => {
    if (!plant || !uid || !gardenId || position === null) return;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const history = await getPlotHarvestsUseCase(uid, gardenId, position.row, position.col, plant?.id);
        setHarvestHistory(history);
      } catch (error) {
        console.error('Error loading harvest history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [uid, gardenId, position, plant?.id]);

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

    // ✅ CLAVE: informamos al padre si es create o edit
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

    const history = await getPlotHarvestsUseCase(uid, gardenId, position.row, position.col, plant?.id);
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
          ? { variant: 'danger', title: 'Eliminado 🗑️', message: 'Cultivo + historial borrados' }
          : { variant: 'danger', title: 'Cultivo eliminado 🗑️', message: 'Historial conservado en BD' },
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
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-6 sticky top-0 z-20">
          <div className="relative flex items-start justify-between gap-4">
            <div className="w-10 h-10 shrink-0" />

            {/* ✅ título centrado */}
            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-xl font-bold text-[#5B7B7A]">
                {plant ? 'Gestionar planta' : 'Añadir Planta'}
              </h3>
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

          {/* Tabs solo si hay planta */}
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
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-2 border-[#CEB5A7]/50 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{currentPlantInfo?.emoji || plant.emoji}</div>
                  <h4 className="text-2xl font-bold text-[#5B7B7A] mb-2">
                    {currentPlantInfo?.name || plant.name}
                  </h4>
                  <p className="text-sm text-[#A17C6B]">
                    Plantado el {new Date(plant.plantedDate).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {loadingHistory ? (
                  <p className="text-center text-sm text-[#A17C6B]">Cargando historial...</p>
                ) : harvestHistory.length > 0 ? (
                  <div className="border-t-2 border-[#CEB5A7]/30 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 border-2 border-[#5B7B7A]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <IoBasketOutline className="w-5 h-5 text-[#5B7B7A]" />
                          <p className="text-xs text-[#A17C6B]">Total recolectado</p>
                        </div>
                        <p className="text-3xl font-bold text-[#5B7B7A]">{historyTotals.units}</p>
                        <p className="text-xs text-[#A17C6B]">unidades</p>
                      </div>

                      {historyTotals.grams > 0 && (
                        <div className="bg-white rounded-xl p-4 border-2 border-[#5B7B7A]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <IoScaleOutline className="w-5 h-5 text-[#5B7B7A]" />
                            <p className="text-xs text-[#A17C6B]">Peso total</p>
                          </div>

                          {historyTotals.grams < 1000 ? (
                            <>
                              <p className="text-3xl font-bold text-[#5B7B7A]">{Math.round(historyTotals.grams)}</p>
                              <p className="text-xs text-[#A17C6B]">gramos</p>
                            </>
                          ) : (
                            <>
                              <p className="text-3xl font-bold text-[#5B7B7A]">{(historyTotals.grams / 1000).toFixed(1)}</p>
                              <p className="text-xs text-[#A17C6B]">kilogramos</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHistoryDetails(!showHistoryDetails)}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#5B7B7A]/10 hover:bg-[#5B7B7A]/20 rounded-xl transition-all font-medium text-[#5B7B7A]"
                    >
                      {showHistoryDetails ? (
                        <>
                          <IoChevronUpOutline className="w-5 h-5" />
                          Ocultar detalles
                        </>
                      ) : (
                        <>
                          <IoChevronDownOutline className="w-5 h-5" />
                          Ver más ({harvestHistory.length})
                        </>
                      )}
                    </button>

                    {showHistoryDetails && (
                      <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
                        {harvestHistory.map((harvest) => {
                          const date = harvest.harvestDate?.toDate?.() || new Date();
                          return (
                            <div key={harvest.id} className="bg-white rounded-xl p-4 border-2 border-[#CEB5A7]/30">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-bold text-[#5B7B7A]">{harvest.units} unidades</p>
                                  <p className="text-xs text-[#A17C6B] mt-1">
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
                                    <p className="font-bold text-[#5B7B7A]">{Math.round(harvest.totalGrams)}g</p>
                                    <p className="text-xs text-[#A17C6B] mt-1">{harvest.gramsPerUnit}g/ud</p>
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
                  <p className="text-center text-sm text-[#A17C6B]">Aún no hay cosechas registradas</p>
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
                      className="w-5 h-5 rounded border-2 border-[#5B7B7A] text-[#5B7B7A] focus:ring-[#5B7B7A]"
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

          {/* VIEW EDIT (sirve tanto para editar como para añadir) */}
          {view === 'edit' && (
            <form id="edit-form" onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#5B7B7A] mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-base"
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
                          ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{plantType.emoji}</span>
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
                className={`px-6 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="harvest-form"
                disabled={saving || !harvestData.units}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 ${saving || !harvestData.units ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
              >
                <IoCheckmarkCircleOutline className="w-5 h-5" />
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
                  className={`px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                >
                  Eliminar
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={`flex-1 px-6 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="edit-form"
                disabled={saving || !selectedCategory || !selectedType}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold ${saving || !selectedCategory || !selectedType ? 'opacity-60 cursor-not-allowed' : ''
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
                <p className="text-xs text-[#A17C6B] mt-2">(Si mantienes el historial, no se borra nada de la base de datos)</p>
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
                  Eliminar cultivo + historial BD
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