import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { IoLeafOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { PiPlantFill } from 'react-icons/pi';
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
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#E0F2E9] via-[#E0F2E9] to-[#CEB5A7]/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-[#5B7B7A]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#A17C6B]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-[#CEB5A7]/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[#CEB5A7]/30 p-8 sm:p-12">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl relative">
              <PiPlantFill className="w-11 h-11 text-white" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#E0F2E9] rounded-lg flex items-center justify-center border-2 border-[#CEB5A7]">
                <IoLeafOutline className="w-4 h-4 text-[#5B7B7A]" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#5B7B7A] mb-3 tracking-tight">Garden Pro</h1>
            <p className="text-[#A17C6B] font-medium">Tu huerto inteligente en la palma de tu mano</p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-600">
              <IoAlertCircleOutline className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
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
          <p className="text-center text-xs text-[#A17C6B] mt-8 leading-relaxed">
            Al continuar, aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;