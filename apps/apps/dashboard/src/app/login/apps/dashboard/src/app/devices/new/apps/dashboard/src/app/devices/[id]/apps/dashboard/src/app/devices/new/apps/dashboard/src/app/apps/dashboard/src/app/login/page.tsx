// apps/dashboard/src/app/login/page.tsx
// AURIX Cyber Platform - Smart Role-Based Auth Gate

'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'controller' | 'monitored'>('controller'); // خيار: مراقِب أم مُراقَب
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
        // إنشاء حساب جديد وتخزين نوع الدور في بيانات الحساب (User Metadata)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { device_role: role }
          }
        });
        if (error) throw error;
        setSuccessMessage('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
        setIsSignUp(false);
      } else {
        // تسجيل الدخول
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // التوجيه الذكي حسب نوع الجهاز المختار
        if (role === 'controller') {
          router.push('/'); // لوحة التحكم الرئيسية (لو هاتف مراقِب)
        } else {
          router.push('/devices/new'); // صفحة الإقران والربط المباشر (لو هاتف مُراقَب)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-[#171A20] p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* اللوجو والشعار الرئيسي */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#171A20] border border-[#C6A15B]/30 mb-3 shadow-lg shadow-[#C6A15B]/10">
            <span className="text-2xl font-black text-[#C6A15B]">A</span>
          </div>
          <h1 className="text-3xl font-black tracking-widest text-[#C6A15B]">AURIX</h1>
          <p className="text-xs text-[#A3A7B0] mt-1">منظومة الحماية والربط الذكي بين الأجهزة</p>
        </div>

        {/* رسائل الخطأ والنجاح */}
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

        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* خيار تحديد نوع الجهاز (مراقِب أو مُراقَب) */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A7B0] mb-2">حدد دور هذا الهاتف في المنظومة:</label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* خيار هاتف المراقِب */}
              <button
                type="button"
                onClick={() => setRole('controller')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  role === 'controller'
                    ? 'bg-[#C6A15B]/10 border-[#C6A15B] text-[#C6A15B]'
                    : 'bg-[#171A20] border-[#171A20] text-[#A3A7B0] hover:border-[#C6A15B]/30'
                }`}
              >
                <span className="text-lg mb-1">🎮</span>
                <div>
                  <span className="block text-xs font-bold">هاتف مُراقِب</span>
                  <span className="text-[10px] opacity-70">لوحة التحكم والخرائط</span>
                </div>
              </button>

              {/* خيار الهاتف المُرَاقَب */}
              <button
                type="button"
                onClick={() => setRole('monitored')}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  role === 'monitored'
                    ? 'bg-[#C6A15B]/10 border-[#C6A15B] text-[#C6A15B]'
                    : 'bg-[#171A20] border-[#171A20] text-[#A3A7B0] hover:border-[#C6A15B]/30'
                }`}
              >
                <span className="text-lg mb-1">📲</span>
                <div>
                  <span className="block text-xs font-bold">هاتف مُرَاقَب</span>
                  <span className="text-[10px] opacity-70">إرسال موقع وبث الإحداثيات</span>
                </div>
              </button>

            </div>
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-xs text-[#A3A7B0] mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all"
              placeholder="name@domain.com"
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="block text-xs text-[#A3A7B0] mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* زر التأكيد */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#C6A15B]/10 disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : isSignUp ? 'إنشاء حساب AURIX جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* التبديل بين تسجيل الدخول وإنشاء حساب */}
        <div className="mt-6 text-center border-t border-[#171A20] pt-4">
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
            
