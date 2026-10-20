// apps/dashboard/src/app/devices/new/page.tsx
// AURIX Cyber Platform - Secure Pairing Code Generator

'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function NewPairingPage() {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const generatePairingCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // توليد رمز عشوائي مكون من 6 أرقام
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // صالح لمدة 5 دقائق

      const { error: insertError } = await supabase.from('pairing_requests').insert([
        {
          account_id: user.id,
          code_hash: randomCode, // في الإنتاج يُفضل تشفيره، وهنا مبسط للتطوير الآمن
          status: 'pending',
          expires_at: expiresAt,
        }
      ]);

      if (insertError) throw insertError;
      setPairingCode(randomCode);
    } catch (err: any) {
      setError(err.message || 'فشل توليد رمز الإقران.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8 flex items-center justify-center">
      <div className="bg-[#111318] border border-[#171A20] p-8 rounded-2xl w-full max-w-lg shadow-2xl text-center">
        <h1 className="text-xl font-bold text-[#C6A15B] mb-2">إقران جهاز آيفون جديد</h1>
        <p className="text-xs text-[#A3A7B0] mb-6">قم بتوليد رمز إقران مؤقت صالح لمرة واحدة ولمدة 5 دقائق فقط لإدخاله في تطبيق الآيفون.</p>

        {error && (
          <div className="bg-[#E05260]/10 border border-[#E05260]/30 text-[#E05260] p-3 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        {pairingCode ? (
          <div className="bg-[#171A20] border border-[#C6A15B]/30 p-6 rounded-xl my-6">
            <span className="text-xs text-[#A3A7B0] block mb-2">رمز الإقران النشط (Pairing Code)</span>
            <div className="text-4xl font-black tracking-widest text-[#C6A15B] font-mono">{pairingCode}</div>
            <p className="text-[10px] text-[#A3A7B0] mt-3">ينتهي خلال 5 دقائق. لا تشارك هذا الرمز مع أي شخص.</p>
          </div>
        ) : (
          <button
            onClick={generatePairingCode}
            disabled={loading}
            className="bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#C6A15B]/10 w-full"
          >
            {loading ? 'جاري التوليد...' : 'توليد رمز الإقران الآمن'}
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
