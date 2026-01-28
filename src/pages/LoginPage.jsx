import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { IoLeafOutline, IoAlertCircleOutline } from "react-icons/io5";
import { PiPlantFill } from "react-icons/pi";
import Button from "../components/Button";

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
    <div className="h-[100svh] w-full bg-gradient-to-br from-[#E0F2E9] to-[#CEB5A7]/50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#5B7B7A]/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#A17C6B]/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-44 h-44 bg-[#CEB5A7]/20 rounded-full blur-3xl -translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-[#CEB5A7]/40 p-6 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#5B7B7A] to-[#A17C6B] mx-auto flex items-center justify-center shadow-lg relative">
              <PiPlantFill className="text-white text-5xl" />
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-[#CEB5A7]/60 shadow-sm">
                <IoLeafOutline className="text-[#5B7B7A] text-lg" />
              </div>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-[#5B7B7A] tracking-tight">
              Garden Manager
            </h1>
            <p className="mt-5 text-sm sm:text-base text-[#A17C6B]">
              Tu huerto inteligente en la palma de tu mano
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex gap-3 items-start">
              <IoAlertCircleOutline className="text-xl shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Button */}
          <div className="w-full">
            <Button
              onClick={handleGoogleLogin}
              loading={loading}
              className="w-full"
              icon={() => (
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-5 h-5"
                  alt=""
                />
              )}
            >
              Continuar con Google
            </Button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[#A17C6B]/90 leading-relaxed">
            Al continuar, aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;