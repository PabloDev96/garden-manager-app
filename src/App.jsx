import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import { Sprout } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          photo: firebaseUser.photoURL,
          email: firebaseUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <Sprout className="w-12 h-12 text-emerald-600 animate-bounce" />
        <p className="mt-4 font-bold text-stone-400 text-xs uppercase tracking-widest">Cargando...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Renderizar vista activa
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'calendar':
        return <Calendar />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;