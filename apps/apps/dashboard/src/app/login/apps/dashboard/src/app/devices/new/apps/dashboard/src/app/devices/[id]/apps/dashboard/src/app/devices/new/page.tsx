// apps/dashboard/src/app/devices/new/page.tsx
// AURIX Cyber Platform - Universal Pairing Gate (QR Code & 5-Min Timer)

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewPairingPage() {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 دقائق بالثواني
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // عداد الـ 5 دقائق التنازلي
  useEffect(() => {
    if (!pairingCode || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [pairingCode, timeLeft]);

  const generatePairingCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from('pairing_requests').insert([
        {
          account_id: user.id,
          code_hash: randomCode,
          status: 'pending',
          expires_at: expiresAt,
        }
      ]);

      if (insertError) throw insertError;

      setPairingCode(randomCode);
      setTimeLeft(300); // إعادة ضبط العداد على 5 دقائق
    } catch (err: any) {
      setError(err.message || 'فشل توليد رمز الإقران.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8 flex items-center justify-center">
      <div className="bg-[#111318] border border-[#171A20] p-8 rounded-2xl w-full max-w-lg shadow-2xl text-center">
        <h1 className="text-xl font-bold text-[#C6A15B] mb-2">إقران جهاز جديد (أندرويد / iOS)</h1>
        <p className="text-xs text-[#A3A7B0] mb-6">قم بمسح رمز QR أو إدخال الرمز المكون من 6 أرقام في التطبيق المرافق لربط الجهاز فوراً.</p>

        {error && (
          <div className="bg-[#E05260]/10 border border-[#E05260]/30 text-[#E05260] p-3 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        {pairingCode && timeLeft > 0 ? (
          <div className="bg-[#171A20] border border-[#C6A15B]/30 p-6 rounded-xl my-6 space-y-4">
            
            {/* QR Code Dynamic Display */}
            <div className="flex justify-center my-4">
              <div className="p-3 bg-white rounded-xl shadow-lg inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${pairingCode}`}
                  alt="Pairing QR Code"
                  className="w-40 h-40"
                />
              </div>
            </div>

            <span className="text-xs text-[#A3A7B0] block">رمز الإقران الرقمي (Pairing Code)</span>
            <div className="text-4xl font-black tracking-widest text-[#C6A15B] font-mono">{pairingCode}</div>

            {/* 5 Minute Countdown Timer */}
            <div className="pt-2 border-t border-[#111318] flex items-center justify-center gap-2">
              <span className="text-xs text-[#A3A7B0]">ينتهي الرمز خلال:</span>
              <span className="text-sm font-bold text-[#E6AD45] font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
        ) : pairingCode && timeLeft <= 0 ? (
          <div className="bg-[#E05260]/10 border border-[#E05260]/30 p-4 rounded-xl my-6">
            <p className="text-xs text-[#E05260] font-bold">انتهت صلاحية الرمز (5 دقائق).</p>
            <button
              onClick={generatePairingCode}
              className="mt-3 text-xs bg-[#C6A15B] text-[#090A0D] font-bold px-4 py-2 rounded-lg"
            >
              توليد رمز جديد
            </button>
          </div>
        ) : (
          <button
            onClick={generatePairingCode}
            disabled={loading}
            className="bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#C6A15B]/10 w-full"
          >
            {loading ? 'جاري التوليد...' : 'توليد رمز الإقران و QR Code'}
          </button>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#A3A7B0] hover:text-[#F5F5F5] transition-colors"
          >
            العودة إلى لوحة التحكم الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
