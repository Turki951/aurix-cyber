// apps/dashboard/src/app/login/page.tsx
// AURIX Cyber Platform - Secure Authentication Gate

'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage('تم إنشاء الحساب بنجاح! يجدر التحقق من بريدك أو يمكنك تسجيل الدخول الآن.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء المصادقة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-[#171A20] p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block w-3 h-3 rounded-full bg-[#C6A15B] animate-pulse mb-2"></div>
          <h1 className="text-2xl font-black tracking-widest text-[#C6A15B]">AURIX</h1>
          <p className="text-xs text-[#A3A7B0] mt-1">بوابة الدخول الآمنة لمنظومة الأجهزة</p>
        </div>

        {errorMessage && (
          <div className="bg-[#E05260]/10 border border-[#E05260]/30 text-[#E05260] p-3 rounded-lg text-xs mb-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-[#36B37E]/10 border border-[#36B37E]/30 text-[#36B37E] p-3 rounded-lg text-xs mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs text-[#A3A7B0] mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-lg px-4 py-2.5 text-sm text-[#F5F5F5] outline-none transition-all"
              placeholder="name@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A3A7B0] mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-lg px-4 py-2.5 text-sm text-[#F5F5F5] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-[#C6A15B]/10 disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[#A3A7B0] hover:text-[#C6A15B] transition-colors"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
      }
            
