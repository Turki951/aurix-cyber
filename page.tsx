'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AurixApp() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'controller' | 'monitored'>('controller');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);
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

  if (!user) {
    return (
      <div style={{ backgroundColor: '#090A0D', color: '#F5F5F5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
        <div style={{ backgroundColor: '#111318', border: '1px solid #171A20', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#C6A15B', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>AURIX</h1>
            <p style={{ color: '#A3A7B0', fontSize: '12px', marginTop: '5px' }}>منظومة الحماية والربط الذكي</p>
          </div>

          {errorMessage && (
            <div style={{ backgroundColor: 'rgba(224, 82, 96, 0.1)', border: '1px solid #E05260', color: '#E05260', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#A3A7B0', display: 'block', marginBottom: '8px' }}>دور هذا الجهاز:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRole('controller')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: role === 'controller' ? '1px solid #C6A15B' : '1px solid #171A20', backgroundColor: role === 'controller' ? 'rgba(198, 161, 91, 0.1)' : '#171A20', color: role === 'controller' ? '#C6A15B' : '#A3A7B0', cursor: 'pointer' }}
                >
                  🎮 مراقِب
                </button>
                <button
                  type="button"
                  onClick={() => setRole('monitored')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: role === 'monitored' ? '1px solid #C6A15B' : '1px solid #171A20', backgroundColor: role === 'monitored' ? 'rgba(198, 161, 91, 0.1)' : '#171A20', color: role === 'monitored' ? '#C6A15B' : '#A3A7B0', cursor: 'pointer' }}
                >
                  📲 مُراقَب
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#A3A7B0', display: 'block', marginBottom: '5px' }}>البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #171A20', backgroundColor: '#171A20', color: '#FFF', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#A3A7B0', display: 'block', marginBottom: '5px' }}>كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #171A20', backgroundColor: '#171A20', color: '#FFF', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#C6A15B', color: '#090A0D', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'جاري المعالجة...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#A3A7B0', fontSize: '12px', cursor: 'pointer' }}
            >
              {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ حساب جديد'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#090A0D', color: '#F5F5F5', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #171A20', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#C6A15B', margin: 0, fontSize: '20px' }}>AURIX PLATFORM</h1>
          <p style={{ color: '#A3A7B0', fontSize: '12px', margin: 0 }}>{user.email}</p>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: 'rgba(224,82,96,0.1)', color: '#E05260', border: '1px solid rgba(224,82,96,0.3)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          خروج
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#111318', border: '1px solid #171A20', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: '#C6A15B', fontSize: '16px', marginTop: 0 }}>إقران جهاز جديد (QR Code)</h2>
          {pairingCode && timeLeft > 0 ? (
            <div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pairingCode}`} alt="QR" style={{ margin: '15px auto', borderRadius: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#C6A15B' }}>{pairingCode}</div>
              <p style={{ fontSize: '12px', color: '#A3A7B0' }}>ينتهي خلال: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</p>
            </div>
          ) : (
            <button onClick={generatePairingCode} disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#C6A15B', border: 'none', borderRadius: '8px', color: '#090A0D', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'جاري التوليد...' : 'توليد QR Code جديد'}
            </button>
          )}
        </div>

        <div style={{ backgroundColor: '#111318', border: '1px solid #171A20', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '16px', marginTop: 0 }}>📱 الأجهزة المربوطة</h2>
          {devices.length === 0 ? (
            <p style={{ color: '#A3A7B0', fontSize: '12px', textAlign: 'center' }}>لا توجد أجهزة مربوطة.</p>
          ) : (
            devices.map((dev) => (
              <div key={dev.id} style={{ backgroundColor: '#171A20', padding: '10px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent
          
