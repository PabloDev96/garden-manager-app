import React, { useState } from 'react';
import {
  IoClose,
  IoGridOutline,
  IoTrashOutline,
  IoAddOutline,
  IoArrowBackOutline,
  IoLeafOutline,
  IoWaterOutline
} from 'react-icons/io5';

import useCellSize from '../utils/calculateCellSize';

// Use cases
import addCropUseCase from '../services/gardens/addCropUseCase';
import removeCropUseCase from '../services/gardens/removeCropUseCase';

const GardenView = ({ uid, garden, onClose, onUpdate, onDelete }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [savingCell, setSavingCell] = useState(false);

  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setShowPlantModal(true);
  };

  const handleAddPlant = async (plantData) => {
    if (!uid || !selectedCell) return;

    try {
      setSavingCell(true);
      await addCropUseCase(uid, garden.id, selectedCell.row, selectedCell.col, plantData);
      setShowPlantModal(false);
      setSelectedCell(null);
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar la planta.');
    } finally {
      setSavingCell(false);
    }
  };

  const handleRemovePlant = async () => {
    if (!uid || !selectedCell) return;

    try {
      setSavingCell(true);
      await removeCropUseCase(uid, garden.id, selectedCell.row, selectedCell.col);
      setShowPlantModal(false);
      setSelectedCell(null);
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar la planta.');
    } finally {
      setSavingCell(false);
    }
  };

  const currentPlant = selectedCell
    ? garden.plants[selectedCell.row]?.[selectedCell.col]
    : null;

  const cellWidth = (garden.dimensions.width / garden.grid.columns).toFixed(2);
  const cellHeight = (garden.dimensions.height / garden.grid.rows).toFixed(2);

  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  // ✅ Grid cell size (más pequeño dentro del huerto)
  const gapPx = 8; // gap-2
  const { ref: gridRef, cellSize } = useCellSize({
    cols: garden.grid.columns,
    gapPx,
    preferred: isMobile ? 36 : 100,
    min: isMobile ? 14 : 18,
  });


  return (
    <div className="fixed inset-0 bg-[#E0F2E9] z-50 overflow-y-auto">
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
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar este huerto?')) {
                  onDelete(garden.id);
                }
              }}
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
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-4">
              <p className="text-xs text-[#A17C6B] mb-1">Parcelas totales</p>
              <p className="text-2xl font-bold text-[#5B7B7A]">
                {garden.grid.rows * garden.grid.columns}
              </p>
            </div>
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-4">
              <p className="text-xs text-[#A17C6B] mb-1">Plantadas</p>
              <p className="text-2xl font-bold text-[#5B7B7A]">
                {garden.plants.flat().filter(p => p !== null).length}
              </p>
            </div>
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-4">
              <p className="text-xs text-[#A17C6B] mb-1">Tamaño/parcela</p>
              <p className="text-xl font-bold text-[#5B7B7A]">
                {cellWidth}×{cellHeight}m
              </p>
            </div>
            <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-4">
              <p className="text-xs text-[#A17C6B] mb-1">Área total</p>
              <p className="text-2xl font-bold text-[#5B7B7A]">
                {(garden.dimensions.width * garden.dimensions.height).toFixed(1)}m²
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#5B7B7A] flex items-center gap-2">
                <IoGridOutline className="w-6 h-6" />
                Cuadrícula del Huerto
              </h2>
              <p className="text-sm text-[#A17C6B]">
                Click en una parcela para gestionarla
              </p>
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
                {garden.plants.map((row, rowIndex) => (
                  row.map((plant, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      disabled={savingCell}
                      className={`rounded-lg border-2 transition-all relative group ${plant
                          ? 'bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] border-[#5B7B7A] hover:shadow-lg'
                          : 'bg-[#E0F2E9] border-[#CEB5A7]/50 hover:border-[#5B7B7A] hover:bg-white'
                        } ${savingCell ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{ width: cellSize, height: cellSize }}
                      title={`Parcela ${rowIndex}, ${colIndex}`}
                    >
                      {plant ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                          <IoLeafOutline className="text-white mb-0.5" style={{ width: Math.min(16, cellSize * 0.5), height: Math.min(16, cellSize * 0.5) }} />
                          <p
                            className="text-[10px] text-white font-bold truncate w-full text-center leading-none"
                            style={{ fontSize: Math.max(8, Math.min(10, Math.floor(cellSize / 4))) }}
                          >
                            {plant.name}
                          </p>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <IoAddOutline className="text-[#5B7B7A]" style={{ width: Math.min(18, cellSize * 0.6), height: Math.min(18, cellSize * 0.6) }} />
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-30">
                        {rowIndex},{colIndex}
                      </span>
                    </button>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Plant Modal */}
      {showPlantModal && (
        <PlantModal
          plant={currentPlant}
          position={selectedCell}
          saving={savingCell}
          onClose={() => {
            setShowPlantModal(false);
            setSelectedCell(null);
          }}
          onSave={handleAddPlant}
          onRemove={currentPlant ? handleRemovePlant : null}
        />
      )}
    </div>
  );
};

// Plant Modal Component
const PlantModal = ({ plant, position, saving, onClose, onSave, onRemove }) => {
  const [formData, setFormData] = useState({
    name: plant?.name || '',
    type: plant?.type || 'vegetable',
    plantedDate: plant?.plantedDate || new Date().toISOString().split('T')[0],
    wateringDays: plant?.wateringDays || 3
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: plant?.id || Date.now().toString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full">
        <div className="bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#5B7B7A]">
                {plant ? 'Editar Planta' : 'Añadir Planta'}
              </h3>
              <p className="text-sm text-[#A17C6B]">
                Parcela [{position?.row}, {position?.col}]
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className={`w-10 h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all ${saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
              <IoClose className="w-5 h-5 text-[#5B7B7A]" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#5B7B7A] mb-2">
              Nombre de la planta
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Tomate Cherry"
              className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5B7B7A] mb-2">
              Tipo de cultivo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
              disabled={saving}
            >
              <option value="vegetable">🥬 Verdura</option>
              <option value="fruit">🍅 Fruta</option>
              <option value="herb">🌿 Hierba aromática</option>
              <option value="flower">🌸 Flor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5B7B7A] mb-2">
              Fecha de plantación
            </label>
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
              onChange={(e) => setFormData({ ...formData, wateringDays: parseInt(e.target.value) })}
              min="1"
              max="30"
              className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-4">
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
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
              disabled={saving}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold ${saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GardenView;