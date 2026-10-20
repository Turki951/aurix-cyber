// apps/dashboard/src/app/page.tsx
// AURIX Cyber Platform - Main Executive Security Dashboard Component

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

        if (devicesData) setDevices(devicesData as Device[]);
        if (auditData) setAuditLogs(auditData as AuditEvent[]);
      } catch (err) {
        console.error('[AURIX] Dashboard data fetch exception:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    // Realtime Listener for Live Location & Device Status Updates
    const channel = supabase
      .channel('aurix-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onlineDevicesCount = devices.filter(d => d.connection_status === 'online').length;

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#171A20] pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#C6A15B] animate-pulse"></div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-[#C6A15B]">AURIX</h1>
            <span className="text-xs bg-[#171A20] text-[#A3A7B0] px-2 py-1 rounded border border-[#C6A15B]/20">CYBER PLATFORM</span>
          </div>
          <p className="text-sm text-[#A3A7B0] mt-1">منظومة إدارة الأجهزة الحية والتحكم في مشاركة الصلاحيات صريحة الموافقة</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/devices/new'} 
            className="bg-[#C6A15B] hover:bg-[#C6A15B]/90 text-[#090A0D] font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-[#C6A15B]/10 flex items-center gap-2"
          >
            <span>+</span> إقران جهاز آيفون جديد
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111318] border border-[#171A20] p-5 rounded-xl">
          <span className="text-xs text-[#A3A7B0] block mb-1">إجمالي الأجهزة المرتبطة</span>
          <span className="text-2xl font-bold text-[#F5F5F5]">{loading ? '...' : devices.length}</span>
        </div>
        <div className="bg-[#111318] border border-[#171A20] p-5 rounded-xl">
          <span className="text-xs text-[#A3A7B0] block mb-1">الأجهزة المتصلة حالياً</span>
          <span className="text-2xl font-bold text-[#36B37E]">{loading ? '...' : onlineDevicesCount}</span>
        </div>
        <div className="bg-[#111318] border border-[#171A20] p-5 rounded-xl">
          <span className="text-xs text-[#A3A7B0] block mb-1">جلسات التتبع النشطة</span>
          <span className="text-2xl font-bold text-[#C6A15B]">{loading ? '...' : onlineDevicesCount}</span>
        </div>
        <div className="bg-[#111318] border border-[#171A20] p-5 rounded-xl">
          <span className="text-xs text-[#A3A7B0] block mb-1">حالة الأمان والربط</span>
          <span className="text-xs font-semibold text-[#36B37E] bg-[#36B37E]/10 px-2 py-1 rounded inline-block mt-1">RLS Policy Active</span>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Device List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
            <span>📱</span> قائمة الأجهزة المعتمدة
          </h2>

          {loading ? (
            <div className="bg-[#111318] p-8 text-center rounded-xl border border-[#171A20] text-[#A3A7B0]">جاري تحميل البيانات من الخادم...</div>
          ) : devices.length === 0 ? (
            <div className="bg-[#111318] p-8 text-center rounded-xl border border-[#171A20]">
              <p className="text-[#A3A7B0] text-sm">لا توجد أجهزة مرتبطة بالحساب حالياً.</p>
              <button 
                onClick={() => window.location.href = '/devices/new'} 
                className="mt-4 text-xs bg-[#171A20] hover:bg-[#171A20]/80 text-[#C6A15B] px-4 py-2 rounded border border-[#C6A15B]/30"
              >
                إنشاء رمز إقران جديد
              </button>
            </div>
          ) : (
            devices.map(device => (
              <div key={device.id} className="bg-[#111318] border border-[#171A20] hover:border-[#C6A15B]/40 p-5 rounded-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${device.connection_status === 'online' ? 'bg-[#36B37E]' : 'bg-[#A3A7B0]'}`}></span>
                    <h3 className="font-bold text-[#F5F5F5]">{device.device_name}</h3>
                    <span className="text-xs bg-[#171A20] text-[#A3A7B0] px-2 py-0.5 rounded">{device.model_name}</span>
                  </div>
                  <p className="text-xs text-[#A3A7B0] mt-2">
                    نظام التشغيل: {device.os_version} | آخر ظهور: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('ar-EG') : 'غير مسجل'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <a 
                    href={`/devices/${device.id}`}
                    className="text-xs bg-[#171A20] hover:bg-[#171A20]/80 text-[#C6A15B] px-3 py-2 rounded-lg border border-[#C6A15B]/30 text-center w-full md:w-auto"
                  >
                    لوحة التحكم الخاصة
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Audit Log Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
            <span>🛡️</span> سجل الأحداث والربط (Audit Events)
          </h2>

          <div className="bg-[#111318] border border-[#171A20] p-4 rounded-xl space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#A3A7B0] text-center py-4">لا توجد أحداث أمنية مسجلة مؤخراً.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="border-b border-[#171A20] pb-2 last:border-none">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#C6A15B]">{log.event_type}</span>
                    <span className="text-[#A3A7B0]">{new Date(log.created_at).toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <p className="text-xs text-[#F5F5F5] mt-1">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
      }
              
