import React from 'react';

const Button = ({ children, loading, icon: Icon, ...props }) => {
  return (
    <button 
      {...props} 
      disabled={loading || props.disabled}
      className="w-full bg-white border-2 border-[#CEB5A7] text-[#5B7B7A] hover:bg-[#E0F2E9] hover:border-[#5B7B7A] p-5 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-3 border-[#CEB5A7] border-t-[#5B7B7A] rounded-full animate-spin"></div>
          <span className="text-sm uppercase tracking-wide">Cargando...</span>
        </div>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span className="text-sm uppercase tracking-wide font-bold">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;