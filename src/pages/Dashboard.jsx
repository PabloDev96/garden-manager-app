import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Sprout, LogOut, Grid, Plus, Droplets, Calendar } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [gardens, setGardens] = useState([]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo y usuario */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Sprout className="w-7 h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-xl font-black text-slate-800">Garden Pro</h2>
                <p className="text-xs text-slate-500">Hola, {user.name.split(' ')[0]}</p>
              </div>
            </div>

            {/* Botón de salir */}
            <button 
              onClick={() => signOut(auth)} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón de nueva parcela */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Mis Parcelas</h1>
            <p className="text-slate-500 text-sm">Gestiona y monitorea tus cultivos</p>
          </div>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg">
            <Plus className="w-5 h-5" />
            Nueva Parcela
          </button>
        </div>

        {/* Estado vacío */}
        {gardens.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-12 sm:p-20 text-center">
            <Grid className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400 mb-2">No tienes parcelas activas</h3>
            <p className="text-stone-400 text-sm mb-6">
              Crea tu primera parcela para empezar a monitorizar tus plantas
            </p>
            <button className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold">
              <Plus className="w-5 h-5" />
              Crear Mi Primera Parcela
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Aquí irán las tarjetas de parcelas */}
          </div>
        )}

        {/* Widget lateral - Próximas tareas */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-stone-200">
            <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Actividad Reciente
            </h3>
            <p className="text-sm text-slate-400">No hay actividad registrada aún.</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
            <h3 className="font-black mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Recordatorio
            </h3>
            <p className="text-sm text-blue-100 mb-4">
              Configura tu primera parcela y empieza a recibir notificaciones de riego.
            </p>
            <div className="text-xs text-blue-200">
              🌱 Mantén tus plantas saludables
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;