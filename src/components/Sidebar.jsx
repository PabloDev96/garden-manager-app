import React, { useState } from 'react';
import { Sprout, Home, Calendar, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Sidebar = ({ user, activeView, setActiveView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-emerald-600 text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Garden Pro</h2>
              <p className="text-xs text-slate-500">Tu huerto inteligente</p>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${
                  activeView === item.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'text-slate-600 hover:bg-stone-100'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer - Botón de salir */}
        <div className="p-4 border-t border-stone-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 