"use client";

import { useAuth, AuthUser } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
      console.error(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-dark) p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-(--accent) flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-black text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            GROILMAN
          </h1>
          <p className="text-white/50 text-sm">Trading Intelligence</p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isSigningIn || loading}
            className="w-full py-3 px-4 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn || loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          <p className="text-white/40 text-xs text-center mt-6">
            Al iniciar sesión, aceptas nuestros términos y política de privacidad
          </p>
        </div>

        <p className="text-white/30 text-xs text-center mt-8">
          Solo para uso autorizado. Contacta al administrador si no tienes acceso.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-dark)">
        <Loader2 className="w-8 h-8 animate-spin text-(--accent)" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <LoginScreen />;
}