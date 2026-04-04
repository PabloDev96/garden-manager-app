import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
    IoLogOutOutline,
    IoMenuOutline,
    IoSettingsOutline,
    IoStatsChartOutline,
    IoCalendarOutline,
} from 'react-icons/io5';
import { PiPlant } from 'react-icons/pi';
import { RiContractLeftLine, RiExpandRightLine } from 'react-icons/ri';

import useDashboard from '../hooks/useDashboard';
import AlertModal from '../components/AlertModal';
import CalendarioSection from '../components/CalendarioSection';
import HoverTooltip from '../components/HoverTooltip';
import ConfirmModal from '../components/ConfirmModal';
import GardenModal from '../components/GardenModal';
import GardenView from '../components/Gardenview';
import HuertosSection from '../components/HuertosSection';
import DashboardSection from '../components/DashboardSection';
import ConfiguracionSection from '../components/ConfiguracionSection';

// ─── Componente principal ─────────────────────────────────────────────────────

const Dashboard = ({ user }) => {
    const {
        uid,
        today,
        gardens,
        alerts,
        menuOpen, setMenuOpen,
        showGardenModal, setShowGardenModal,
        showAlertModal, setShowAlertModal,
        selectedGarden, setSelectedGarden,
        loadingGardens,
        gardenTotalsMap, setGardenTotalsMap,
        activeSection, setActiveSection,
        showLogoutConfirm, setShowLogoutConfirm,
        menuExpanded, setMenuExpanded,
        handleSaveGarden,
        handleUpdateGarden,
        handleDeleteGarden,
        handleSaveAlert,
    } = useDashboard(user);

    const NAV_ITEMS = [
        { id: 'huertos', label: 'Huertos', icon: PiPlant },
        { id: 'dashboard', label: 'Dashboard', icon: IoStatsChartOutline },
        { id: 'calendario', label: 'Calendario', icon: IoCalendarOutline, badge: alerts.filter(a => a.date === today).length || null },
        { id: 'configuracion', label: 'Configuración', icon: IoSettingsOutline },
    ];

    // GardenView ocupa toda la pantalla
    if (selectedGarden) {
        return (
            <GardenView
                uid={uid}
                garden={selectedGarden}
                onClose={() => setSelectedGarden(null)}
                onUpdate={handleUpdateGarden}
                onDelete={handleDeleteGarden}
                onTotalsUpdate={(gardenId, totals) =>
                    setGardenTotalsMap((prev) => ({ ...prev, [gardenId]: totals }))
                }
            />
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[#E0F2E9]">

                {menuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={() => setMenuOpen(false)}
                    />
                )}

                <div
                    className={`fixed top-0 left-0 h-full ${menuExpanded ? 'w-60' : 'w-24'} bg-white border-r-2 border-[#CEB5A7] z-50 transform transition-all duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onMouseEnter={() => setMenuOpen(true)}
                    onMouseLeave={() => setMenuOpen(false)}
                >
                    <div className="px-2 py-2 border-b-2 border-[#CEB5A7]/30 bg-gradient-to-br from-[#E0F2E9] to-white">
                        <div
                            className={`flex items-center
                                ${menuExpanded
                                    ? 'gap-3 px-2 py-2 bg-white rounded-2xl border-2 border-[#CEB5A7]/50'
                                    : 'justify-center'
                                }`}
                        >
                            <div
                                className={`overflow-hidden shrink-0 flex items-center justify-center
                                    ${menuExpanded
                                        ? 'w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B]'
                                        : 'w-12 h-12 rounded-xl'
                                    }`}
                            >
                                <img
                                    src={user.photo}
                                    alt=""
                                    className="w-full h-full object-cover block"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add(
                                            'text-white', 'font-bold', 'bg-gradient-to-br', 'from-[#5B7B7A]', 'to-[#A17C6B]'
                                        );
                                        e.currentTarget.parentElement?.append(
                                            document.createTextNode(user?.name?.charAt(0)?.toUpperCase() ?? '?')
                                        );
                                    }}
                                />
                            </div>

                            {menuExpanded && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#5B7B7A] truncate">{user.name}</p>
                                    <p className="text-xs text-[#A17C6B] truncate">{user.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <nav className="p-4 space-y-6">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeSection === item.id;
                            const btn = (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveSection(item.id); setMenuOpen(false); }}
                                    className={`flex items-center rounded-xl transition-all font-medium cursor-pointer
                                        ${menuExpanded
                                            ? 'w-full gap-4 px-3 py-3 justify-start'
                                            : 'justify-center w-12 h-12 mx-auto'
                                        }
                                        ${isActive
                                            ? 'bg-gradient-to-r from-[#5B7B7A] to-[#A17C6B] text-white shadow-lg'
                                            : 'text-[#5B7B7A] hover:bg-[#E0F2E9] border-2 border-transparent hover:border-[#CEB5A7]'
                                        }`}
                                >
                                    <span className="relative shrink-0">
                                        <item.icon className="w-6 h-6" />
                                        {item.badge && (
                                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none border-2 border-white shadow-sm">
                                                {item.badge}
                                            </span>
                                        )}
                                    </span>
                                    {menuExpanded && <span className="truncate">{item.label}</span>}
                                    {menuExpanded && item.badge && (
                                        <span className="ml-auto shrink-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">hoy</span>
                                    )}
                                </button>
                            );

                            return menuExpanded ? (
                                <div key={item.id}>{btn}</div>
                            ) : (
                                <HoverTooltip key={item.id} label={item.label} mode="auto" className="block">
                                    {btn}
                                </HoverTooltip>
                            );
                        })}
                    </nav>

                    <div
                        className={`absolute bottom-4 left-0 right-0 px-3 flex ${menuExpanded ? 'justify-end pr-2' : 'justify-center'}`}
                    >
                        <HoverTooltip label={menuExpanded ? 'Contraer menú' : 'Expandir menú'} mode="auto">
                            <button
                                type="button"
                                onClick={() => setMenuExpanded((v) => !v)}
                                className="group w-12 h-12 flex items-center justify-center rounded-xl hover:bg-[#E0F2E9] transition-all cursor-pointer"
                                aria-label={menuExpanded ? 'Contraer menú' : 'Expandir menú'}
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

                <header className="bg-white/80 backdrop-blur-md border-b border-[#CEB5A7]/30 sticky top-0 z-30">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setMenuOpen(true)}
                                onMouseEnter={() => setMenuOpen(true)}
                                className="w-12 h-12 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-xl flex items-center justify-center hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <IoMenuOutline className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            </button>

                            <div className="relative group">
                                <HoverTooltip label="Cerrar sesión" mode="auto" className="inline-flex">
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                                        aria-label="Cerrar sesión"
                                    >
                                        <IoLogOutOutline className="w-7 h-7 transition-transform duration-200 group-hover:scale-110" />
                                    </button>
                                </HoverTooltip>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                    {activeSection === 'huertos' && (
                        <HuertosSection
                            gardens={gardens}
                            loadingGardens={loadingGardens}
                            gardenTotalsMap={gardenTotalsMap}
                            onOpenGarden={setSelectedGarden}
                            onAddGarden={() => setShowGardenModal(true)}
                            onAddAlert={() => setShowAlertModal(true)}
                        />
                    )}
                    {activeSection === 'dashboard' && <DashboardSection uid={uid} gardens={gardens} />}
                    {activeSection === 'calendario' && <CalendarioSection alerts={alerts} />}
                    {activeSection === 'configuracion' && <ConfiguracionSection />}
                </main>

                <ConfirmModal
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    title="Cerrar sesión"
                    description="¿Seguro que quieres cerrar sesión?"
                    variant="danger"
                    actions={[
                        { label: 'Cancelar', style: 'cancel', onClick: () => setShowLogoutConfirm(false) },
                        { label: 'Cerrar sesión', style: 'danger', onClick: () => signOut(auth) },
                    ]}
                />
            </div>

            <GardenModal
                isOpen={showGardenModal}
                onClose={() => setShowGardenModal(false)}
                onSave={handleSaveGarden}
            />

            <AlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                onSave={handleSaveAlert}
                gardens={gardens}
            />
        </>
    );
};

export default Dashboard;
