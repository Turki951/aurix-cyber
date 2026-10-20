// apps/dashboard/src/app/page.tsx
// Realtime Executive Dashboard - Strict Pure Data Mode

'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Device, AuditEvent } from '@aurix/shared-types';

export default function AurixDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { data: devicesData } = await supabase
          .from('devices')
          .select('*')
          .order('last_seen_at', { ascending: false });

        const { data: auditData } = await supabase
          .from('audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setDevices((devicesData as Device[]) || []);
        setAuditLogs((auditData as AuditEvent[]) || []);
      } catch (err) {
        console.error('[AURIX] Error fetching pure data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    const channel = supabase
      .channel('aurix-realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#171A20] pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#C6A15B] animate-pulse"></div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-[#C6A15B]">AURIX</h1>
            <span className="text-xs bg-[#171A20] text-[#A3A7B0] px-2 py-1 rounded border border-[#C6A15B]/20">UNIVERSAL PLATFORM</span>
          </div>
          <p className="text-sm text-[#A3A7B0] mt-1">منظومة إدارة الأجهزة الحية والتتبع الحقيقي (أندرويد / iOS)</p>
        </div>

        <button 
          onClick={() => window.location.href = '/devices/new'} 
          className="bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-[#C6A15B]/10 flex items-center gap-2"
        >
          <span>+</span> إقران جهاز جديد (QR / Code)
        </button>
      </header>

      {/* Device List Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
          <span>📱</span> الأجهزة المربوطة والمفعلة فعلياً
        </h2>

        {loading ? (
          <div className="bg-[#111318] p-8 text-center rounded-xl border border-[#171A20] text-[#A3A7B0]">جاري الاتصال بالخادم وقراءة الأجهزة...</div>
        ) : devices.length === 0 ? (
          <div className="bg-[#111318] p-12 text-center rounded-xl border border-[#171A20] space-y-3">
            <p className="text-[#A3A7B0] text-sm">لا يوجد أي جهاز مرتبط بحسابك حالياً (لا توجد بيانات وهمية).</p>
            <button 
              onClick={() => window.location.href = '/devices/new'} 
              className="text-xs bg-[#171A20] hover:bg-[#171A20]/80 text-[#C6A15B] px-4 py-2 rounded border border-[#C6A15B]/30"
            >
              قم بإقران هاتفك الأندرويد أو الآيفون الأول الآن
            </button>
          </div>
        ) : (
          devices.map(device => (
            <div key={device.id} className="bg-[#111318] border border-[#171A20] hover:border-[#C6A15B]/40 p-5 rounded-xl transition-all flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#F5F5F5]">{device.device_name}</h3>
                <p className="text-xs text-[#A3A7B0] mt-1">{device.model_name} | {device.os_version}</p>
              </div>
              <a 
                href={`/devices/${device.id}`}
                className="text-xs bg-[#171A20] text-[#C6A15B] px-3 py-2 rounded-lg border border-[#C6A15B]/30"
              >
                فتح لوحة التحكم
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
        }
