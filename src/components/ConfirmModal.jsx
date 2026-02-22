import React from 'react';


/**
 * ConfirmModal — modal de confirmación reutilizable con la paleta de la app.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - title: string
 *  - description?: string
 *  - variant?: 'danger' | 'warning' | 'default'
 *  - actions: Array<{ label, onClick, style: 'primary'|'danger'|'ghost'|'cancel', disabled? }>
 */

const ConfirmModal = ({ isOpen, onClose, title, description, variant = 'danger', actions = [] }) => {
  if (!isOpen) return null;

  const buttonStyles = {
    cancel:  'bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm',
    ghost:   'bg-white/10 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm',
    primary: 'bg-white text-[#5B7B7A] font-bold hover:bg-white/90 shadow-md',
    danger:  'bg-[#A17C6B] text-white font-bold hover:bg-[#8e6b5b] shadow-md',
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #5B7B7A 0%, #4a6968 60%, #A17C6B 100%)',
          animation: 'modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h4 className="text-base font-bold text-white leading-tight">{title}</h4>
          {description && (
            <p className="text-sm text-white/70 mt-1 leading-snug">{description}</p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/15 mb-4" />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer
                ${buttonStyles[action.style] || buttonStyles.ghost}
                ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;