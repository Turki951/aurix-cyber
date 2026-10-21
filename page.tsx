'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// إعداد Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AurixUnifiedApp() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'controller' | 'monitored'>('controller');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // حالة الإقران (QR Code)
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);

  // حالة الأجهزة المربوطة
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchDevices();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchDevices();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!pairingCode || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [pairingCode, timeLeft]);

  const fetchDevices = async () => {
    const { data } = await supabase.from('devices').select('*').order('last_seen_at', { ascending: false });
    setDevices(data || []);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { device_role: role } }
        });
        if (error) throw error;
        alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء العملية.');
    } finally {
      setLoading(false);
    }
  };

  const generatePairingCode = async () => {
    setLoading(true);
    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from('pairing_requests').insert([
        { account_id: user.id, code_hash: randomCode, status: 'pending', expires_at: expiresAt }
      ]);

      setPairingCode(randomCode);
      setTimeLeft(300);
    } catch (err: any) {
      alert('فشل توليد رمز الإقران');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 1. شاشة تسجيل الدخول لو المستخدم مش مسجل
  if (!user) {
    return (
      <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right flex items-center justify-center p-4">
        <div className="bg-[#111318] border border-[#171A20] p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#171A20] border border-[#C6A15B]/30 mb-3">
              <span className="text-2xl font-black text-[#C6A15B]">A</span>
            </div>
            <h1 className="text-3xl font-black tracking-widest text-[#C6A15B]">AURIX</h1>
            <p className="text-xs text-[#A3A7B0] mt-1">منظومة الحماية والربط الذكي</p>
          </div>

          {errorMessage && (
            <div className="bg-[#E05260]/10 border border-[#E05260]/30 text-[#E05260] p-3 rounded-lg text-xs mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs text-[#A3A7B0] mb-2">دور هذا الهاتف:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('controller')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    role === 'controller' ? 'bg-[#C6A15B]/10 border-[#C6A15B] text-[#C6A15B]' : 'bg-[#171A20] text-[#A3A7B0]'
                  }`}
                >
                  <span className="block text-xs font-bold">🎮 مراقِب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('monitored')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    role === 'monitored' ? 'bg-[#C6A15B]/10 border-[#C6A15B] text-[#C6A15B]' : 'bg-[#171A20] text-[#A3A7B0]'
                  }`}
                >
                  <span className="block text-xs font-bold">📲 مُراقَب</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A3A7B0] mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A3A7B0] mb-1">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#171A20] border border-[#171A20] focus:border-[#C6A15B] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C6A15B] text-[#090A0D] font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all"
            >
              {loading ? 'جاري المعالجة...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-[#171A20] pt-4">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#A3A7B0] hover:text-[#C6A15B]"
            >
              {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ حساب جديد'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. لوحة التحكم الرئيسية بعد تسجيل الدخول
  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8">
      <header className="flex justify-between items-center border-b border-[#171A20] pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#C6A15B]">AURIX PLATFORM</h1>
          <p className="text-xs text-[#A3A7B0]">أهلاً بك: {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-[#E05260]/10 text-[#E05260] border border-[#E05260]/30 px-3 py-2 rounded-lg"
        >
          تسجيل الخروج
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم توليد الإقران */}
        <div className="bg-[#111318] border border-[#171A20] p-6 rounded-2xl text-center">
          <h2 className="text-lg font-bold text-[#C6A15B] mb-2">إقران جهاز جديد (QR Code)</h2>
          <p className="text-xs text-[#A3A7B0] mb-4">مولد الرموز السريعة لربط الأجهزة</p>

          {pairingCode && timeLeft > 0 ? (
            <div className="bg-[#171A20] p-4 rounded-xl space-y-3">
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pairingCode}`}
                  alt="QR Code"
                  className="w-36 h-36 bg-white p-2 rounded-lg"
                />
              </div>
              <div className="text-3xl font-mono font-black text-[#C6A15B]">{pairingCode}</div>
              <p className="text-xs text-[#A3A7B0]">ينتهي خلال: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</p>
            </div>
          ) : (
            <button
              onClick={generatePairingCode}
              disabled={loading}
              className="bg-[#C6A15B] text-[#090A0D] font-bold px-6 py-3 rounded-xl text-sm w-full"
            >
              {loading ? 'جاري التوليد...' : 'توليد QR Code جديد'}
            </button>
          )}
        </div>

        {/* قسم قائمة الأجهزة */}
        <div className="bg-[#111318] border border-[#171A20] p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-4">📱 الأجهزة المربوطة والمفعلة</h2>
          {devices.length === 0 ? (
            <p className="text-xs text-[#A3A7B0] text-center py-8">لا توجد أجهزة مربوطة حالياً.</p>
          ) : (
            <div className="space-y-3">
              {devices.map((dev) => (
                <div key={dev.id} className="bg-[#171A20] p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-[#F5F5F5]">{dev.device_name}</p>
                    <p className="text-[10px] text-[#A3A7B0]">{dev.os_version}</p>
                  </div>
                  <span className="text-[10px] bg-[#36B37E]/10 text-[#36B37E] px-2 py-1 rounded">متصل</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
                                           }
    
