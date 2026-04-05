import React, { useState, useEffect } from 'react';
import { IoCloseOutline, IoNotificationsOutline, IoCalendarOutline } from 'react-icons/io5';
import DateInput from './DateInput';
import SelectInput from './SelectInput';

const AlertModal = ({ isOpen, onClose, onSave, gardens = [] }) => {
    const [gardenId, setGardenId] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setGardenId(gardens[0]?.id ?? '');
            setContent('');
            setDate('');
            setErrors({});
        }
    }, [isOpen, gardens]);

    if (!isOpen) return null;

    const validate = () => {
        const e = {};
        if (!gardenId) e.gardenId = 'Selecciona un huerto';
        if (!content.trim()) e.content = 'Escribe el contenido del recordatorio';
        if (!date) e.date = 'Selecciona una fecha';
        return e;
    };

    const handleSave = () => {
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onSave({ gardenId, content: content.trim(), date });
        onClose();
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#CEB5A7]/40 overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <IoNotificationsOutline className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight">Nuevo recordatorio</h2>
                            <p className="text-white/70 text-xs">Añade una alerta a tu calendario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer">
                        <IoCloseOutline className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-5">

                    {/* Huerto */}
                    <div>
                        <label className="block text-sm font-semibold text-[#5B7B7A] mb-2">Huerto</label>
                        {gardens.length === 0 ? (
                            <div className="w-full px-4 py-3 rounded-xl border-2 border-[#CEB5A7]/40 bg-[#E0F2E9]/50 text-sm text-[#A17C6B] italic">
                                No tienes huertos creados
                            </div>
                        ) : (
                            <SelectInput
                                value={gardenId}
                                onChange={(val) => { setGardenId(val); setErrors((p) => ({ ...p, gardenId: null })); }}
                                options={gardens.map((g) => ({ value: g.id, label: g.name ?? g.id }))}
                                placeholder="Selecciona un huerto"
                                error={errors.gardenId}
                            />
                        )}
                        {errors.gardenId && <p className="mt-1.5 text-xs text-red-500">{errors.gardenId}</p>}
                    </div>

                    {/* Contenido */}
                    <div>
                        <label className="block text-sm font-semibold text-[#5B7B7A] mb-2">Recordatorio</label>
                        <textarea
                            value={content}
                            onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: null })); }}
                            placeholder="Ej: Regar las tomateras, abonar el bancal norte…"
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-[#3D5A59] bg-white outline-none transition-colors resize-none ${errors.content ? 'border-red-400 bg-red-50' : 'border-[#CEB5A7]/40 focus:border-[#5B7B7A]'}`}
                        />
                        {errors.content && <p className="mt-1.5 text-xs text-red-500">{errors.content}</p>}
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-semibold text-[#5B7B7A] mb-2">Fecha</label>
                        <DateInput
                            value={date}
                            onChange={(val) => { setDate(val); setErrors((p) => ({ ...p, date: null })); }}
                            min={today}
                            error={errors.date}
                        />
                        {errors.date && <p className="mt-1.5 text-xs text-red-500">{errors.date}</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border-2 border-[#CEB5A7]/40 text-sm font-semibold text-[#A17C6B] hover:bg-[#E0F2E9] transition-colors cursor-pointer">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={gardens.length === 0} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        Guardar recordatorio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;