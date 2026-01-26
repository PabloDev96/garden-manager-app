import React from 'react';

const Button = ({ children, loading, icon: Icon, ...props }) => {
  return (
    <button 
      {...props} 
      disabled={loading || props.disabled}
      className="w-full bg-white border-2 border-stone-200 text-slate-700 hover:bg-stone-50 p-5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="text-sm uppercase tracking-wide">Cargando...</span>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          <span className="text-sm uppercase tracking-wide">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;