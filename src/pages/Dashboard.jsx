import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  IoLeafOutline,
  IoLogOutOutline,
  IoAddOutline,
  IoWaterOutline,
  IoSunnyOutline,
  IoWarningOutline,
  IoTrendingUpOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoNotificationsOutline
} from 'react-icons/io5';

const Dashboard = ({ user }) => {
  const [gardens, setGardens] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  console.log(user);

  const stats = [
    { label: 'Huertos Activos', value: gardens.length, icon: IoLeafOutline, color: 'bg-[#5B7B7A]' },
    { label: 'Alertas Pendientes', value: 0, icon: IoWarningOutline, color: 'bg-[#A17C6B]' },
    { label: 'Riego Hoy', value: 0, icon: IoWaterOutline, color: 'bg-[#5B7B7A]' },
    { label: 'Días de Sol', value: 5, icon: IoSunnyOutline, color: 'bg-[#CEB5A7]' }
  ];

  const menuItems = [
    { icon: IoHomeOutline, label: 'Inicio', active: true },
    { icon: IoStatsChartOutline, label: 'Estadísticas', active: false },
    { icon: IoNotificationsOutline, label: 'Notificaciones', active: false },
    { icon: IoSettingsOutline, label: 'Configuración', active: false },
  ];

  return (
    <div className="min-h-screen bg-[#E0F2E9]">
      {/* Overlay cuando el menú está abierto */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white border-r-2 border-[#CEB5A7] z-50 transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        {/* Menu Header */}
        <div className="p-6 border-b-2 border-[#CEB5A7]/30 bg-gradient-to-br from-[#E0F2E9] to-white">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-[#CEB5A7]/50">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] flex items-center justify-center">
              <img
                src={user.photo}
                alt=""
                className="w-full h-full object-cover block"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add("text-white", "font-bold");
                  e.currentTarget.parentElement?.append(
                    document.createTextNode(user?.name?.charAt(0)?.toUpperCase() ?? "?")
                  );
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#5B7B7A] truncate">{user.name}</p>
              <p className="text-xs text-[#A17C6B] truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-medium ${item.active
                ? 'bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow-lg'
                : 'text-[#5B7B7A] hover:bg-[#E0F2E9] border-2 border-transparent hover:border-[#CEB5A7]'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-[#CEB5A7]/30 bg-white">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 transition-all font-medium"
          >
            <IoLogOutOutline className="w-8 h-8" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#CEB5A7]/30 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              onMouseEnter={() => setMenuOpen(true)}
              className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center hover:shadow-xl transition-all group"
            >
              <IoMenuOutline className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Logout Button */}
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 px-2 py-2 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all font-medium group"
            >
              <IoLogOutOutline className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Main Section - Huertos */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#5B7B7A] mb-1">Mis Huertos</h2>
              <p className="text-[#A17C6B]">Gestiona y monitorea tus cultivos</p>
            </div>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-6 py-3.5 rounded-xl hover:shadow-xl transition-all font-bold group">
              <IoAddOutline className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Nuevo Huerto
            </button>
          </div>

          {/* Empty State */}
          {gardens.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#CEB5A7] rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-[#E0F2E9] rounded-full flex items-center justify-center mx-auto mb-6">
                <IoLeafOutline className="w-10 h-10 text-[#5B7B7A]" />
              </div>
              <h3 className="text-2xl font-bold text-[#5B7B7A] mb-2">No tienes huertos activos</h3>
              <p className="text-[#A17C6B] mb-8 max-w-md mx-auto">
                Crea tu primer huerto para empezar a monitorizar tus plantas y recibir alertas de riego
              </p>
              <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all font-bold group">
                <IoAddOutline className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Crear Mi Primer Huerto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Aquí irán las tarjetas de huertos */}
            </div>
          )}
        </div>

        {/* Bottom Section - Alerts & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alertas Recientes */}
          <div className="lg:col-span-2 bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-8">
            <h3 className="font-bold text-xl text-[#5B7B7A] mb-6 flex items-center gap-2">
              <IoWarningOutline className="w-6 h-6 text-[#A17C6B]" />
              Alertas y Actividad
            </h3>
            <div className="space-y-4">
              <div className="text-center py-12">
                <p className="text-[#A17C6B]">No hay alertas por el momento</p>
                <p className="text-sm text-[#CEB5A7] mt-2">Todo está bajo control 🌱</p>
              </div>
            </div>
          </div>

          {/* Consejo del día */}
          <div className="bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <IoWaterOutline className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-3">💡 Consejo del Día</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                El mejor momento para regar es temprano en la mañana. Las plantas absorben mejor el agua y reduces la evaporación.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <IoSunnyOutline className="w-4 h-4" />
                Jardinería sostenible
              </div>
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl p-6 hover:shadow-lg hover:border-[#5B7B7A] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <IoTrendingUpOutline className="w-5 h-5 text-[#A17C6B] opacity-50" />
              </div>
              <p className="text-3xl font-bold text-[#5B7B7A] mb-1">{stat.value}</p>
              <p className="text-sm text-[#A17C6B] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;