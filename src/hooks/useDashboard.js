import { useState, useEffect } from 'react';
import { notify } from '../utils/notify';
import subscribeGardensUseCase from '../services/gardens/subscribeGardensUseCase';
import getGardenTotalsUseCase from '../services/gardens/getGardenTotalUseCase';
import subscribeAlertsUseCase from '../services/alerts/subscribeAlertsUseCase';
import requestPermissionUseCase from '../services/notifications/requestPermissionUseCase';
import addGardenUseCase from '../services/gardens/addGardenUseCase';
import updateGardenUseCase from '../services/gardens/updateGardenUseCase';
import deleteGardenUseCase from '../services/gardens/deleteGardenUseCase';
import addAlertUseCase from '../services/alerts/addAlertUseCase';
import getCalendarCropsUseCase from '../services/settings/getCalendarCropsUseCase';
import saveCalendarCropsUseCase from '../services/settings/saveCalendarCropsUseCase';

const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function useDashboard(user) {
    const uid = user?.uid;
    const today = todayKey();

    const [gardens, setGardens] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showGardenModal, setShowGardenModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [selectedGarden, setSelectedGarden] = useState(null);
    const [loadingGardens, setLoadingGardens] = useState(true);
    const [gardenTotalsMap, setGardenTotalsMap] = useState({});
    const [activeSection, setActiveSection] = useState('huertos');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [menuExpanded, setMenuExpanded] = useState(() => {
        const saved = localStorage.getItem('menuExpanded');
        return saved ? JSON.parse(saved) : false;
    });
    const [calendarCrops, setCalendarCrops] = useState([]);

    // Bienvenida
    useEffect(() => {
        if (!user?.uid) return;
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        if (!justLoggedIn) return;
        sessionStorage.removeItem('justLoggedIn');
        const firstName = typeof user?.name === 'string' ? user.name.split(' ')[0] : '';
        notify.success({
            title: `¡Bienvenido${firstName ? `, ${firstName}` : ''}! 🌿`,
            description: 'Empieza a gestionar tus huertos y cultivos',
            duration: 2500,
        });
    }, [user]);

    // Suscripción realtime de huertos
    useEffect(() => {
        if (!uid) return;
        setLoadingGardens(true);
        const unsub = subscribeGardensUseCase(
            uid,
            async (items) => {
                setGardens(items);
                setLoadingGardens(false);
                setSelectedGarden((prev) => {
                    if (!prev) return prev;
                    return items.find((g) => g.id === prev.id) ?? prev;
                });
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

    // Suscripción realtime de alertas
    useEffect(() => {
        if (!uid) return;
        const unsub = subscribeAlertsUseCase(
            uid,
            setAlerts,
            (err) => console.error('Error cargando alertas:', err)
        );
        return () => unsub();
    }, [uid]);

    // Notificaciones push
    useEffect(() => {
        if (!uid) return;
        requestPermissionUseCase(uid);
    }, [uid]);

    // Persistir estado del menú
    useEffect(() => {
        localStorage.setItem('menuExpanded', JSON.stringify(menuExpanded));
    }, [menuExpanded]);

    // Cargar cultivos extra del calendario desde Firestore
    useEffect(() => {
        if (!uid) return;
        getCalendarCropsUseCase(uid).then(setCalendarCrops).catch(console.error);
    }, [uid]);

    const handleToggleCalendarCrop = async (cropName) => {
        const next = calendarCrops.includes(cropName)
            ? calendarCrops.filter((c) => c !== cropName)
            : [...calendarCrops, cropName];
        setCalendarCrops(next);
        try {
            await saveCalendarCropsUseCase(uid, next);
        } catch (e) {
            console.error(e);
            setCalendarCrops(calendarCrops); // revertir en caso de error
        }
    };

    const handleSaveGarden = async (newGarden) => {
        if (!uid) return;
        try {
            await addGardenUseCase(uid, newGarden);
            setShowGardenModal(false);
            notify.success({ title: 'Huerto creado', description: '¡Listo! Ya puedes añadir tus cultivos', duration: 2000 });
        } catch (e) {
            console.error(e);
            notify.error({ title: 'No se pudo crear el huerto', description: 'Inténtalo de nuevo en unos segundos' });
        }
    };

    const handleUpdateGarden = async (updatedGarden) => {
        if (!uid || !updatedGarden?.id) return;
        try {
            await updateGardenUseCase(uid, updatedGarden.id, updatedGarden);
        } catch (e) {
            console.error(e);
            notify.error({ title: 'No se pudo actualizar el huerto', description: 'Inténtalo de nuevo en unos segundos' });
        }
    };

    const handleDeleteGarden = async (gardenId) => {
        if (!uid || !gardenId) return;
        try {
            await deleteGardenUseCase(uid, gardenId);
            setSelectedGarden(null);
        } catch (e) {
            console.error(e);
            notify.error({ title: 'No se pudo eliminar el huerto', description: 'Inténtalo de nuevo en unos segundos' });
        }
    };

    const handleSaveAlert = async (alert) => {
        if (!uid) return;
        try {
            await addAlertUseCase(uid, alert);
            const [y, m, d] = alert.date.split('-');
            notify.success({ title: 'Recordatorio guardado 🔔', description: `Alerta para el ${d}/${m}/${y}`, duration: 2000 });
        } catch (e) {
            console.error(e);
            notify.error({ title: 'No se pudo guardar el recordatorio', description: 'Inténtalo de nuevo en unos segundos' });
        }
    };

    return {
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
        calendarCrops,
        handleToggleCalendarCrop,
    };
}
