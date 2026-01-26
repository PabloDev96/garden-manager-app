import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { Sprout, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Error al iniciar sesión con Google");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Garden Pro</h1>
          <p className="text-slate-500 text-sm font-medium">Inicia sesión para continuar</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botón de Google */}
        <Button 
          onClick={handleGoogleLogin} 
          loading={loading}
          icon={() => (
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-5 h-5" 
              alt="Google" 
            />
          )}
        >
          Continuar con Google
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
};

export default LoginPage;