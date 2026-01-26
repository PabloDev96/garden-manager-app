import React from 'react';
import { Bell, Droplets, AlertCircle } from 'lucide-react';

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: 'water',
      title: 'Recordatorio de riego',
      message: 'Es hora de regar tus tomates',
      time: 'Hace 2 horas',
      icon: Droplets,
      color: 'blue'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Alerta climática',
      message: 'Se esperan heladas esta noche',
      time: 'Hace 5 horas',
      icon: AlertCircle,
      color: 'orange'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Notificaciones</h1>
        <p className="text-slate-500 text-sm">Mantente al día con tus cultivos</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200'
          };

          return (
            <div
              key={notification.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[notification.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-1">{notification.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-slate-400">{notification.time}</p>
                </div>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-12 text-center">
            <Bell className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400 mb-2">No hay notificaciones</h3>
            <p className="text-stone-400 text-sm">Cuando tengas alertas aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;