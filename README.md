# Garden Manager App

Aplicación web progresiva (PWA) para la gestión de huertos urbanos. Permite monitorizar cultivos, registrar cosechas, consultar el tiempo y recibir recordatorios mediante notificaciones push.

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Variables de entorno](#variables-de-entorno)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Deploy](#deploy)
- [Firebase](#firebase)
- [Notificaciones push](#notificaciones-push)

---

## Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React 19 + Vite 7 |
| Estilos | Tailwind CSS 4 |
| Backend / DB | Firebase (Firestore, Auth, Cloud Functions) |
| Notificaciones | Firebase Cloud Messaging (FCM) |
| Gráficas | Recharts |
| Calendario | react-calendar |
| Iconos | react-icons |
| Toasts | sileo |
| Meteorología | Open-Meteo API (gratuita, sin API key) |

---

## Arquitectura

El proyecto sigue una arquitectura **feature-based con separación de capas**:

- **Pages** — solo composición y renderizado, sin lógica de negocio directa.
- **Hooks** — estado y efectos extraídos de los componentes. Cada hook encapsula una responsabilidad.
- **Components** — componentes UI reutilizables y componentes de sección.
- **Services / Use Cases** — funciones puras que interactúan con Firebase. Sin estado React.
- **Utils** — funciones auxiliares y base de datos estática de cultivos.
- **Config** — inicialización de Firebase.

---

## Estructura del proyecto

```
garden-manager-app/
├── functions/                        # Cloud Functions (Node.js)
│   └── index.js                      # Función de recordatorios diarios (cron 08:00 Madrid)
│
├── public/
│   └── firebase-messaging-sw.js      # Service Worker generado automáticamente (NO editar)
│
├── src/
│   ├── config/
│   │   └── firebase.js               # Inicialización de Firebase (usa variables de entorno)
│   │
│   ├── hooks/
│   │   ├── useDashboard.js           # Estado global del dashboard (huertos, alertas, modales)
│   │   ├── useGridSelection.js       # Selección de celdas en la cuadrícula del huerto
│   │   └── useOpenMeteo.js           # Consulta de meteorología a Open-Meteo API
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx             # Layout principal: sidebar, header, secciones
│   │   └── LoginPage.jsx             # Pantalla de autenticación con Google
│   │
│   ├── components/
│   │   ├── HuertosSection.jsx        # Sección de listado y gestión de huertos
│   │   ├── DashboardSection.jsx      # Sección de KPIs y gráfica de cosechas
│   │   ├── ConfiguracionSection.jsx  # Sección de configuración (en desarrollo)
│   │   ├── CalendarioSection.jsx     # Calendario con meteorología y alertas
│   │   ├── Gardenview.jsx            # Vista detallada de un huerto (cuadrícula, cosechas)
│   │   ├── HarvestChart.jsx          # Gráfica de producción diaria y acumulada
│   │   ├── Gardencard.jsx            # Tarjeta de resumen de un huerto
│   │   ├── Gardenmodal.jsx           # Modal para crear/editar un huerto
│   │   ├── AlertModal.jsx            # Modal para crear recordatorios
│   │   ├── ConfirmModal.jsx          # Modal de confirmación genérico
│   │   ├── SelectInput.jsx           # Select personalizado con portal
│   │   ├── DateInput.jsx             # Date picker personalizado con portal
│   │   ├── Button.jsx                # Botón reutilizable
│   │   └── HoverTooltip.jsx          # Tooltip al hacer hover
│   │
│   ├── services/
│   │   ├── alerts/
│   │   │   ├── addAlertUseCase.js          # Crear alerta en Firestore
│   │   │   └── subscribeAlertsUseCase.js   # Suscripción realtime a alertas
│   │   ├── gardens/
│   │   │   ├── addGardenUseCase.js         # Crear huerto
│   │   │   ├── updateGardenUseCase.js      # Actualizar huerto
│   │   │   ├── deleteGardenUseCase.js      # Eliminar huerto
│   │   │   ├── subscribeGardensUseCase.js  # Suscripción realtime a huertos
│   │   │   ├── addCropUseCase.js           # Plantar cultivo en una celda
│   │   │   ├── removeCropUseCase.js        # Eliminar cultivo de una celda
│   │   │   ├── addHarvestUseCase.js        # Registrar cosecha
│   │   │   ├── getGardenHarvestsUseCase.js # Obtener historial de cosechas del huerto
│   │   │   ├── getGardenTotalUseCase.js    # Calcular totales de cosechas por huerto
│   │   │   └── getPlotHarvestUseCase.js    # Obtener cosechas de una parcela concreta
│   │   └── notifications/
│   │       └── requestPermissionUseCase.js # Solicitar permiso y registrar token FCM
│   │
│   ├── utils/
│   │   ├── cropsDatabase.js          # Base de datos estática de cultivos (nombre, emoji, etc.)
│   │   ├── calculateCellSize.js      # Cálculo del tamaño de celda según el grid
│   │   └── notify.js                 # Wrapper de toasts (sileo)
│   │
│   ├── firebase-messaging-sw.template.js  # Template del Service Worker (se compila en build)
│   ├── App.jsx                            # Raíz: maneja autenticación y enrutado
│   └── main.jsx                           # Punto de entrada React
│
├── .env                              # Variables de entorno (NO subir a git)
├── .env.example                      # Plantilla de variables de entorno
├── .gitignore
├── firebase.json                     # Configuración de Firebase Hosting + Functions
├── vite.config.js                    # Config de Vite + plugin de generación del SW
└── package.json
```

---

## Funcionalidades

### Autenticación
- Login con Google mediante Firebase Auth.
- Sesión persistente. Si no hay sesión activa se muestra la pantalla de login.

### Huertos
- Crear, editar y eliminar huertos.
- Cada huerto tiene una cuadrícula de parcelas configurables.
- Selección de parcelas por arrastre (escritorio) o pulsación larga (móvil).
- Cada parcela puede tener un cultivo plantado con fecha de plantación.

### Cultivos
- Base de datos integrada de cultivos con emoji, nombre y categoría.
- Asignar/eliminar cultivos en celdas del huerto.

### Cosechas
- Registrar cosechas por parcela con cantidad en gramos y fecha.
- Gráfica de producción diaria y acumulada por planta (Recharts).
- Totales de cosecha visibles en la tarjeta de cada huerto.

### Recordatorios y alertas
- Crear recordatorios con fecha y descripción.
- Badge en el menú de calendario con el número de alertas del día.
- Notificaciones push automáticas cada día a las 08:00 (hora de Madrid) si hay alertas para ese día.

### Calendario
- Vista de calendario mensual con indicadores de alertas por día.
- Integración meteorológica mediante Open-Meteo API (temperatura, precipitación, condición).
- Búsqueda de ubicación para obtener el tiempo de cualquier localización.

### Dashboard
- KPIs: huertos activos, alertas pendientes, etc.
- Gráfica de cosechas con selector de huerto y planta.

---

## Variables de entorno

Copia `.env.example` como `.env` y rellena los valores con los de tu proyecto Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

> Las variables con prefijo `VITE_` son accesibles en el código fuente mediante `import.meta.env.VITE_*`.
>
> El Service Worker (`public/firebase-messaging-sw.js`) se genera automáticamente al ejecutar `vite dev` o `vite build` a partir del template `src/firebase-messaging-sw.template.js`, inyectando los valores del `.env`. El archivo generado está en `.gitignore`.

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Arrancar en modo desarrollo (también genera el Service Worker)
npm run dev
```

El servidor de desarrollo estará disponible en `http://localhost:5173`.

---

## Deploy

El deploy publica tanto el hosting (React) como las Cloud Functions:

```bash
npm run deploy
```

Este comando ejecuta `vite build` (que regenera el Service Worker con las variables del `.env`) y después `firebase deploy`.

> Asegúrate de tener el `.env` con los valores correctos antes de hacer deploy.

---

## Firebase

### Firestore — Estructura de colecciones

```
users/
  {uid}/
    alerts/
      {alertId}/
        content: string
        date: string (YYYY-MM-DD)
    fcmTokens/
      {token}/
        token: string
        createdAt: string (ISO)
    gardens/
      {gardenId}/
        name: string
        plants: array (cuadrícula de celdas)
        ...
        harvests/
          {harvestId}/
            plantName: string
            plantEmoji: string
            totalGrams: number
            harvestDate: Timestamp
```

### Cloud Functions

| Función | Trigger | Descripción |
|---------|---------|-------------|
| `enviarRecordatoriosHoy` | Cron `00 08 * * *` (Europe/Madrid) | Recorre todos los usuarios, obtiene las alertas del día y envía notificaciones FCM a todos sus tokens registrados |

---

## Notificaciones push

El flujo completo de notificaciones es:

1. **Permiso**: Al hacer login, `requestPermissionUseCase` solicita permiso al navegador.
2. **Token**: Se obtiene el token FCM del dispositivo con la VAPID key.
3. **Registro**: Se eliminan los tokens anteriores y se guarda el nuevo en `users/{uid}/fcmTokens`.
4. **Envío**: La Cloud Function diaria lee los tokens y envía notificaciones mediante Firebase Admin SDK.
5. **Recepción en primer plano**: `onMessage` en `requestPermissionUseCase` muestra la notificación vía Service Worker.
6. **Recepción en segundo plano**: El Service Worker (`firebase-messaging-sw.js`) intercepta el mensaje con `onBackgroundMessage` y muestra la notificación del sistema.

> **iOS**: Las notificaciones push en iOS requieren Safari (no privado) y que la app esté instalada como PWA desde "Añadir a pantalla de inicio". Las notificaciones en segundo plano en iOS tienen soporte limitado.
