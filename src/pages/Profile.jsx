import React from 'react';
import { User, Mail, Calendar, MapPin } from 'lucide-react';

const Profile = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Mi Perfil</h1>
        <p className="text-slate-500 text-sm">Gestiona tu información personal</p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-8">
        {/* Avatar y nombre */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-stone-200">
          <div className="w-24 h-24 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl overflow-hidden shadow-lg">
            {user.photo ? (
              <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-800 mb-1">{user.name}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Información del perfil */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Email</p>
              <p className="text-sm font-bold text-slate-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Miembro desde</p>
              <p className="text-sm font-bold text-slate-800">Enero 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Ubicación</p>
              <p className="text-sm font-bold text-slate-800">No configurada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;