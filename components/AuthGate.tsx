'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  LogOut,
  Building2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    isAdmin, 
    loading, 
    authError, 
    loginWithGoogle, 
    logout,
    clearError
  } = useAuth();

  const [submitting, setSubmitting] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 animate-bounce">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-200 animate-pulse">
          التحقق من الصلاحيات والاتصال بـ Firebase...
        </h2>
        <p className="text-xs text-slate-400 mt-1">يرجى الانتظار لحظات</p>
      </div>
    );
  }

  // If user is authenticated and IS an admin, render the full application!
  if (user && isAdmin) {
    return <>{children}</>;
  }

  // If user is authenticated but NOT an admin, show Access Denied screen
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 selection:bg-rose-500/30">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            غير مصرح لك بالوصول
          </h2>
          
          <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-xs text-rose-300 mb-6 text-right space-y-2">
            <p className="font-semibold">
              تم تسجيل الدخول بواسطة: <span className="font-mono text-white underline">{user.email}</span>
            </p>
            <p className="text-rose-400 leading-relaxed">
              هذه المنظومة مخصصة لإدارة الفواتير والمديونيات بصلاحية <strong>المدير العام فقط (Admin)</strong>. هذا الحساب لا يمتلك الصلاحيات المطلوبة.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => logout()}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج والتبديل لحساب المدير</span>
            </button>
            <p className="text-[11px] text-slate-400">
              حساب المدير العام المعتمد: <br />
              <strong className="text-emerald-400 font-mono">jalalmahmoud8000@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Google Sign-In Only Screen
  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 sm:p-6 text-slate-100 selection:bg-emerald-500/30">
      <div className="w-full max-w-md">
        
        {/* Brand Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 mb-3.5">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              منظومة توريدات وفواتير المنظفات
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>تسجيل دخول المدير العام عبر Gmail</span>
            </div>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
              <button 
                onClick={clearError}
                className="text-rose-400 hover:text-white text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Features list */}
          <div className="space-y-2.5 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>مزامنة سحابية لحظية مع Firebase Firestore</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>إدارة وتتبع الفواتير والتحصيلات والديون</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>حماية وتشفير عالي بصلاحية المدير فقط</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm sm:text-base transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
          >
            {submitting ? (
              <span className="text-slate-700 font-semibold text-sm">جارِ التحقق وتسجيل الدخول...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>المتابعة وتسجيل الدخول عبر Google</span>
              </>
            )}
          </button>

          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يرجى اختيار حساب المدير العام المعتمد للدخول مباشرة إلى لوحة الفواتير.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
