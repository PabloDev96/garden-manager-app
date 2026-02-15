import React, { useEffect, useState } from 'react';
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
import { PiPlant } from "react-icons/pi";
import { RiContractLeftLine, RiExpandRightLine } from "react-icons/ri";

import HoverTooltip from "../components/HoverTooltip";
import GardenModal from '../components/GardenModal';
import GardenCard from '../components/Gardencard';
import GardenView from '../components/Gardenview';
import getGardenTotalsUseCase from '../services/gardens/getGardenTotalUseCase';

// Use cases
import subscribeGardensUseCase from '../services/gardens/subscribeGardensUseCase';
import addGardenUseCase from '../services/gardens/addGardenUseCase';
import updateGardenUseCase from '../services/gardens/updateGardenUseCase';
import deleteGardenUseCase from '../services/gardens/deleteGardenUseCase';

const Dashboard = ({ user }) => {
  const [gardens, setGardens] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGardenModal, setShowGardenModal] = useState(false);
  const [selectedGarden, setSelectedGarden] = useState(null);
  const [loadingGardens, setLoadingGardens] = useState(true);
  const [gardenTotalsMap, setGardenTotalsMap] = useState({});
  const [menuExpanded, setMenuExpanded] = useState(() => {
    const saved = localStorage.getItem("menuExpanded");
    return saved ? JSON.parse(saved) : false;
  });

  // ====== MODALES / NOTICES ======
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [successGardenModal, setSuccessGardenModal] = useState(false);
  const [welcomeModal, setWelcomeModal] = useState(false);

  const uid = user?.uid;

  useEffect(() => {
    if (!user?.uid) return;

    // Solo una vez por sesión (evita que salga cada re-render)
    const key = `welcome_shown_${user.uid}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, '1');
    setWelcomeModal(true);

    // autocierre
    const t = setTimeout(() => setWelcomeModal(false), 2500);
    return () => clearTimeout(t);
  }, [user?.uid]);

  // Suscripción realtime de huertos del usuario
  useEffect(() => {
    if (!uid) return;

    setLoadingGardens(true);

    const unsub = subscribeGardensUseCase(
      uid,
      async (items) => {
        setGardens(items);
        setLoadingGardens(false);

        // mantener selectedGarden actualizado
        setSelectedGarden((prev) => {
          if (!prev) return prev;
          const updated = items.find((g) => g.id === prev.id);
          return updated ?? prev;
        });

        // ✅ cargar totales para las cards (1 vez por huerto)
        try {
          const pairs = await Promise.all(
            items.map(async (g) => {
              const totals = await getGardenTotalsUseCase(uid, g.id);
              return [g.id, totals];
            })
          );

          setGardenTotalsMap((prev) => {
            const next = { ...prev };
            for (const [id, totals] of pairs) next[id] = totals;
            return next;
          });
        } catch (e) {
          console.error('Error cargando totales de huertos:', e);
        }
      },
      (err) => {
        console.error('Error cargando huertos:', err);
        setLoadingGardens(false);
      }
    );

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    localStorage.setItem("menuExpanded", JSON.stringify(menuExpanded));
  }, [menuExpanded]);

  const handleSaveGarden = async (newGarden) => {
    if (!uid) return;
    try {
      await addGardenUseCase(uid, newGarden);

      setShowGardenModal(false);
      setSuccessGardenModal(true);
      setTimeout(() => setSuccessGardenModal(false), 2200);
    } catch (e) {
      console.error(e);
      alert('No se pudo crear el huerto.');
    }
  };

  const handleUpdateGarden = async (updatedGarden) => {
    if (!uid || !updatedGarden?.id) return;

    try {
      await updateGardenUseCase(uid, updatedGarden.id, updatedGarden);
    } catch (e) {
      console.error(e);
      alert('No se pudo actualizar el huerto.');
    }
  };

  const handleDeleteGarden = async (gardenId) => {
    if (!uid || !gardenId) return;

    try {
      await deleteGardenUseCase(uid, gardenId);
      setSelectedGarden(null);
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar el huerto.');
    }
  };

  const handleOpenGarden = (garden) => {
    setSelectedGarden(garden);
  };

  // Si hay un huerto seleccionado, mostramos GardenView
  if (selectedGarden) {
    return (
      <GardenView
        uid={uid}
        garden={selectedGarden}
        onClose={() => setSelectedGarden(null)}
        onUpdate={handleUpdateGarden}
        onDelete={handleDeleteGarden}

        // para actualizar GardenCard al volver atrás desde GardenView
        onTotalsUpdate={(gardenId, totals) => {
          setGardenTotalsMap((prev) => ({
            ...prev,
            [gardenId]: totals,
          }));
        }}
      />
    );
  }

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
    <>
      <div className="min-h-screen bg-[#E0F2E9]">
        {/* Overlay cuando el menú está abierto */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => {
              setMenuOpen(false);
            }}
          />
        )}

        {/* Slide-out Menu */}
        <div
          className={`fixed top-0 left-0 h-full ${menuExpanded ? "w-60" : "w-24"
            } bg-white border-r-2 border-[#CEB5A7] z-50 transform transition-all duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => {
            setMenuOpen(false);
          }}
        >
          {/* Menu Header */}
          <div className="px-2 py-2 border-b-2 border-[#CEB5A7]/30 bg-gradient-to-br from-[#E0F2E9] to-white">
            <div
              className={`flex items-center bg-white rounded-2xl border-2 border-[#CEB5A7]/50 ${menuExpanded ? "gap-3 px-2 py-2" : "justify-center py-2"
                }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] flex items-center justify-center">
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

              {/* Info solo expanded */}
              {menuExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#5B7B7A] truncate">{user.name}</p>
                  <p className="text-xs text-[#A17C6B] truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-6">
            {menuItems.map((item, index) => {
              const btn = (
                <button
                  key={index}
                  className={`flex items-center rounded-xl transition-all font-medium
    ${menuExpanded
                      ? "w-full gap-4 px-3 py-3 justify-start"
                      : "justify-center w-12 h-12 mx-auto"
                    }
    ${item.active
                      ? "bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow-lg"
                      : "text-[#5B7B7A] hover:bg-[#E0F2E9] border-2 border-transparent hover:border-[#CEB5A7]"
                    }`}
                >
                  <item.icon className="w-6 h-6 shrink-0" />
                  {menuExpanded && <span className="truncate">{item.label}</span>}
                </button>
              );

              // Tooltip solo en modo mini (para saber qué icono es)
              return menuExpanded ? (
                btn
              ) : (
                <HoverTooltip key={index} label={item.label} mode="auto" className="block">
                  {btn}
                </HoverTooltip>
              );
            })}
          </nav>

          {/* Expand / Collapse Button */}
          <div
            className={`absolute bottom-4 left-0 right-0 px-3 flex ${menuExpanded ? "justify-end pr-2" : "justify-center"
              }`}
          >
            <HoverTooltip
              label={menuExpanded ? "Contraer menú" : "Expandir menú"}
              mode="auto"
            >
              <button
                type="button"
                onClick={() => setMenuExpanded((v) => !v)}
                className="group w-12 h-12 flex items-center justify-center rounded-xl hover:bg-[#E0F2E9] transition-all"
                aria-label={menuExpanded ? "Contraer menú" : "Expandir menú"}
              >
                {menuExpanded ? (
                  <RiContractLeftLine className="w-6 h-6 text-[#5B7B7A] transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <RiExpandRightLine className="w-6 h-6 text-[#5B7B7A] transition-transform duration-200 group-hover:scale-110" />
                )}
              </button>
            </HoverTooltip>
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
              <div className="relative group">
                <HoverTooltip label="Cerrar sesión" mode="auto" className="inline-flex">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl
      text-red-600 hover:bg-red-50 transition-all duration-200 font-medium cursor-pointer"
                    aria-label="Cerrar sesión"
                  >
                    <IoLogOutOutline className="w-8 h-8 transition-transform duration-200 group-hover:scale-110" />
                  </button>
                </HoverTooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Main Section - Huertos */}
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold text-[#5B7B7A]">
                Mis Huertos
              </h2>

              <HoverTooltip label="Añadir huerto" mode="auto" className="inline-flex">
                <button
                  type="button"
                  onClick={() => setShowGardenModal(true)}
                  className="group flex items-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-4 py-2.5 rounded-xl hover:shadow-xl transition-all font-bold cursor-pointer"
                  aria-label="Añadir huerto"
                >
                  <IoAddOutline className="w-5 h-5 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
                  <PiPlant className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-110" />
                </button>
              </HoverTooltip>
            </div>

            {/* Empty State or Gardens Grid */}
            {loadingGardens ? (
              <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-10 text-center">
                <p className="text-[#A17C6B]">Cargando huertos...</p>
              </div>
            ) : gardens.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#CEB5A7] rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-[#E0F2E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <IoLeafOutline className="w-10 h-10 text-[#5B7B7A]" />
                </div>
                <h3 className="text-2xl font-bold text-[#5B7B7A] mb-2">No tienes huertos activos</h3>
                <p className="text-[#A17C6B] mb-8 max-w-md mx-auto">
                  Crea tu primer huerto para empezar a monitorizar tus plantas y recibir alertas de riego
                </p>
                <button
                  onClick={() => setShowGardenModal(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all font-bold group"
                >
                  <IoAddOutline className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Crear Mi Primer Huerto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
                {gardens.map((garden) => (
                  <HoverTooltip key={garden.id} label="Ver detalles" className="h-full">
                    <div className="h-full">
                      <GardenCard
                        garden={{
                          ...garden,
                          totals: gardenTotalsMap[garden.id] ?? { totalUnits: 0, totalGrams: 0 },
                        }}
                        onClick={handleOpenGarden}
                      />
                    </div>
                  </HoverTooltip>
                ))}
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
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h4 className="text-lg font-bold text-[#5B7B7A]">Cerrar sesión</h4>
                <p className="text-sm text-[#A17C6B] mt-2">
                  ¿Seguro que quieres cerrar sesión?
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-[#CEB5A7] text-[#5B7B7A] rounded-xl hover:bg-[#E0F2E9] transition-all font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
        {successGardenModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-5 text-center">
              <h4 className="text-lg font-bold text-[#5B7B7A]">Huerto creado</h4>
              <p className="text-sm text-[#A17C6B] mt-2">¡Listo! Ya puedes añadir tus cultivos 🌱</p>
            </div>
          </div>
        )}
        {welcomeModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-[#CEB5A7]/40 shadow-xl p-5 text-center">
              <h4 className="text-lg font-bold text-[#5B7B7A]">
                ¡Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h4>
              <p className="text-sm text-[#A17C6B] mt-2">
                Vamos a cuidar tus huertos 🌿
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Garden Modal */}
      <GardenModal
        isOpen={showGardenModal}
        onClose={() => setShowGardenModal(false)}
        onSave={handleSaveGarden}
      />
    </>
  );
};

export default Dashboard;