import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { PiPlantFill } from 'react-icons/pi';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-[#E0F2E9] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse mb-4">
          <PiPlantFill className="w-9 h-9 text-white" />
        </div>
        <p className="font-bold text-[#5B7B7A] text-sm tracking-wider">Cargando Garden Pro...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <Dashboard user={user} />;
};

export default App;