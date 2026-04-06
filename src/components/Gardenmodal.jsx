import React, { useState } from 'react';
import { IoCloseOutline, IoGridOutline } from 'react-icons/io5';

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
      plants: {},
      createdAt: new Date().toISOString()
    };

    onSave(garden);
    setFormData({ name: '', width: '', height: '', rows: '', columns: '' });
    onClose();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  const cellWidth = formData.width && formData.columns
    ? (parseFloat(formData.width) / parseInt(formData.columns)).toFixed(2) : 0;
  const cellHeight = formData.height && formData.rows
    ? (parseFloat(formData.height) / parseInt(formData.rows)).toFixed(2) : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl border-2 border-[#CEB5A7]/40">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <IoGridOutline className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Nuevo huerto</h2>
              <p className="text-white/70 text-xs">Configura las dimensiones y cuadrícula</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Cerrar"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form id="garden-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#5B7B7A] mb-2">Nombre del huerto</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Huerto Principal"
              className="w-full px-4 py-3 border-2 border-[#CEB5A7]/40 rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm text-[#3D5A59]"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#5B7B7A] mb-3">Dimensiones del terreno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">Ancho (metros)</label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="5.0"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7]/40 rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm text-[#3D5A59]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">Largo (metros)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="10.0"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7]/40 rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm text-[#3D5A59]"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#5B7B7A] mb-3">Configuración de cuadrícula</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">Columnas</label>
                <input
                  type="number"
                  name="columns"
                  value={formData.columns}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  placeholder="5"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7]/40 rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm text-[#3D5A59]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A17C6B] mb-2">Filas</label>
                <input
                  type="number"
                  name="rows"
                  value={formData.rows}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  placeholder="10"
                  className="w-full px-4 py-3 border-2 border-[#CEB5A7]/40 rounded-xl focus:outline-none focus:border-[#5B7B7A] transition-all text-sm text-[#3D5A59]"
                />
              </div>
            </div>
          </div>

          {formData.width && formData.height && formData.rows && formData.columns && (
            <div className="bg-[#E0F2E9] border-2 border-[#CEB5A7]/50 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-[#5B7B7A] mb-3">Información calculada</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Total de parcelas</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">{parseInt(formData.rows) * parseInt(formData.columns)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Tamaño por parcela</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">{cellWidth}m × {cellHeight}m</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Área total</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">{(parseFloat(formData.width) * parseFloat(formData.height)).toFixed(2)}m²</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#CEB5A7]/30">
                  <p className="text-[#A17C6B] text-xs mb-1">Área por parcela</p>
                  <p className="text-[#5B7B7A] font-bold text-lg">{(cellWidth * cellHeight).toFixed(2)}m²</p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t-2 border-[#CEB5A7]/30 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#CEB5A7]/40 text-sm font-semibold text-[#A17C6B] hover:bg-[#E0F2E9] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="garden-form"
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-sm font-bold text-white hover:shadow-lg transition-all cursor-pointer"
          >
            Crear huerto
          </button>
        </div>
      </div>
    </div>
  );
};

export default GardenModal;
