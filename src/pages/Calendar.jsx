import React from 'react';
import { Calendar as CalendarIcon, Sprout } from 'lucide-react';

const Calendar = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Calendario de Siembra</h1>
        <p className="text-slate-500 text-sm">Planifica tus cultivos por temporada</p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-12 sm:p-20 text-center">
        <CalendarIcon className="w-16 h-16 text-stone-200 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-400 mb-2">Calendario próximamente</h3>
        <p className="text-stone-400 text-sm">
          Aquí podrás ver las fechas óptimas de siembra para cada cultivo
        </p>
      </div>
    </div>
  );
};

export default Calendar;