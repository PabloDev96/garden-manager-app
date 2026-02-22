import React, { useState } from 'react';
import { IoClose, IoAddOutline, IoGridOutline } from 'react-icons/io5';

const GardenModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    width: '',
    height: '',
    rows: '',
    columns: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const garden = {
      id: Date.now().toString(),
      name: formData.name,
      dimensions: {
        width: parseFloat(formData.width),
        height: parseFloat(formData.height)
      },
      grid: {
        rows: parseInt(formData.rows),
        columns: parseInt(formData.columns)
      },
      plants: {}, // Firestore-friendly: mapa de "row_col" -> plantData
      createdAt: new Date().toISOString()
    };

    onSave(garden);
    setFormData({ name: '', width: '', height: '', rows: '', columns: '' });
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  const cellWidth = formData.width && formData.columns ?
    (parseFloat(formData.width) / parseInt(formData.columns)).toFixed(2) : 0;
  const cellHeight = formData.height && formData.rows ?
    (parseFloat(formData.height) / parseInt(formData.rows)).toFixed(2) : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-br from-[#E0F2E9] to-white border-b-2 border-[#CEB5A7]/30 p-6">
          <div className="relative flex items-start justify-between gap-4">
            {/* Placeholder para centrar el título como en PlantModal */}
            <div className="w-10 h-10 shrink-0" />

            <div className="flex-1 min-w-0 text-center">
              <h2 className="text-2xl font-bold text-[#5B7B7A]">Nuevo Huerto</h2>
              <p className="text-sm text-[#A17C6B]">Configura las dimensiones y cuadrícula</p>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 bg-white border-2 border-[#CEB5A7] rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all group"
              aria-label="Cerrar"
            >
              <IoClose className="w-5 h-5 text-[#5B7B7A] group-hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nombre del huerto */}
          <div>
            <label className="block text-sm font-bold text-[#5B7B7A] mb-2">
              Nombre del Huerto
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Huerto Principal"
              className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
            />
          </div>

          {/* Dimensiones */}
          <div>
            <h3 className="text-sm font-bold text-[#5B7B7A] mb-3">Dimensiones del Terreno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">
                  Ancho (metros)
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="5.0"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">
                  Largo (metros)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="10.0"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Cuadrícula */}
          <div>
            <h3 className="text-sm font-bold text-[#5B7B7A] mb-3">Configuración de Cuadrícula</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">
                  Columnas
                </label>
                <input
                  type="number"
                  name="columns"
                  value={formData.columns}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  placeholder="5"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">
                  Filas
                </label>
                <input
                  type="number"
                  name="rows"
                  value={formData.rows}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  placeholder="10"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7] rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preview Info */}
          {formData.width && formData.height && formData.rows && formData.columns && (
            <div className="bg-[#E0F2E9] border-2 border-[#CEB5A7]/50 rounded-2xl p-4">
              <h4 className="text-sm font-bold text-[#5B7B7A] mb-3">📊 Información Calculada</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Total de parcelas</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">
                    {parseInt(formData.rows) * parseInt(formData.columns)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Tamaño por parcela</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">
                    {cellWidth}m × {cellHeight}m
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Área total</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">
                    {(parseFloat(formData.width) * parseFloat(formData.height)).toFixed(2)}m²
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Área por parcela</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">
                    {(cellWidth * cellHeight).toFixed(2)}m²
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer fijo */}
        <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#CEB5A7]/30 p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 group"
            >
              Crear Huerto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenModal;