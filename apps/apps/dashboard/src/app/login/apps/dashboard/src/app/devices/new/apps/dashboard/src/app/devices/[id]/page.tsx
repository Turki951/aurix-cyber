// apps/dashboard/src/app/devices/[id]/page.tsx
// AURIX Cyber Platform - Live Device Tracking & Control Panel

'use client';

import React, { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
import { Device, DevicePermissions, LocationUpdate } from '@aurix/shared-types';
import { useRouter } from 'next/navigation';

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const deviceId = resolvedParams.id;
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [permissions, setPermissions] = useState<DevicePermissions | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationUpdate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeviceData() {
      setLoading(true);
      try {
        // Fetch Device Details
        const { data: devData, error: devErr } = await supabase
          .from('devices')
          .select('*')
          .eq('id', deviceId)
          .single();

        if (devErr || !devData) throw new Error('تعذر العثور على الجهاز أو غير مصرح لك بالوصول إليه.');
        setDevice(devData as Device);

        // Fetch Permissions
        const { data: permData } = await supabase
          .from('device_permissions')
          .select('*')
          .eq('device_id', deviceId)
          .single();

        if (permData) setPermissions(permData as DevicePermissions);

        // Fetch Latest Location Update
        const { data: locData } = await supabase
          .from('location_updates')
          .select('*')
          .eq('device_id', deviceId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (locData) setLastLocation(locData as LocationUpdate);

      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تحميل بيانات الجهاز.');
      } finally {
        setLoading(false);
      }
    }

    loadDeviceData();

    // Live Realtime Subscriptions for Location Updates
    const channel = supabase
      .channel(`device-live-${deviceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'location_updates',
        filter: `device_id=eq.${deviceId}`
      }, (payload) => {
        console.log('[AURIX Realtime] New GPS Coordinate:', payload.new);
        setLastLocation(payload.new as LocationUpdate);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const handleUnpairDevice = async () => {
    if (!confirm('هل أنت تأكد من إلغاء ربط هذا الجهاز؟ سيتم إبطال جميع الصلاحيات فوراً.')) return;
    
    try {
      await supabase.from('devices').delete().eq('id', deviceId);
      router.push('/');
    } catch (err: any) {
      alert('فشل إلغاء الربط: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-8 flex items-center justify-center">
        <p className="text-[#C6A15B] text-sm animate-pulse">جاري الاتصال بالخادم وجلب بيانات الجهاز الحية...</p>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-8 flex items-center justify-center">
        <div className="bg-[#111318] border border-[#E05260]/30 p-6 rounded-xl max-w-md text-center">
          <p className="text-[#E05260] text-sm mb-4">{error || 'الجهاز غير موجود.'}</p>
          <button onClick={() => router.push('/')} className="text-xs bg-[#171A20] text-[#F5F5F5] px-4 py-2 rounded">
            العودة للوحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F5] font-sans dir-rtl text-right p-4 md:p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#171A20] pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${device.connection_status === 'online' ? 'bg-[#36B37E]' : 'bg-[#A3A7B0]'}`}></span>
            <h1 className="text-2xl font-bold text-[#F5F5F5]">{device.device_name}</h1>
            <span className="text-xs bg-[#171A20] text-[#C6A15B] px-2 py-1 rounded border border-[#C6A15B]/20">
              {device.model_name} ({device.os_version})
            </span>
          </div>
          <p className="text-xs text-[#A3A7B0] mt-1">
            معرف الجهاز: <span className="font-mono text-[#F5F5F5]">{device.id}</span>
          </p>
        </div>

        <button
          onClick={handleUnpairDevice}
          className="bg-[#E05260]/10 hover:bg-[#E05260]/20 text-[#E05260] border border-[#E05260]/30 font-bold px-4 py-2 rounded-lg text-xs transition-all"
        >
          إلغاء ربط الجهاز وحذف البيانات
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Map & GPS Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111318] border border-[#171A20] p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold text-[#C6A15B] flex items-center gap-2">
                <span>📍</span> تتبع الموقع الجغرافي الحي (CoreLocation)
              </h2>
              {lastLocation && (
                <span className="text-[10px] bg-[#36B37E]/10 text-[#36B37E] px-2 py-0.5 rounded border border-[#36B37E]/20">
                  تحديث حي (Realtime)
                </span>
              )}
            </div>

            {/* Embedded Map Visualizer */}
            {lastLocation ? (
              <div className="space-y-4">
                <div className="w-full h-72 bg-[#171A20] rounded-xl overflow-hidden border border-[#171A20] relative flex items-center justify-center">
                  <iframe
                    title="Live Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}&z=15&output=embed`}
                    className="filter grayscale contrast-125 opacity-80 hover:opacity-100 transition-opacity"
                  ></iframe>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-[#171A20] p-4 rounded-xl">
                  <div>
                    <span className="text-[#A3A7B0] block mb-0.5">خط العرض (Latitude)</span>
                    <span className="font-mono font-bold text-[#F5F5F5]">{lastLocation.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[#A3A7B0] block mb-0.5">خط الطول (Longitude)</span>
                    <span className="font-mono font-bold text-[#F5F5F5]">{lastLocation.longitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[#A3A7B0] block mb-0.5">درجة الدقة</span>
                    <span className="font-mono font-bold text-[#36B37E]">±{lastLocation.accuracy?.toFixed(1) || 'N/A'} متر</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#171A20] rounded-xl border border-[#171A20]">
                <p className="text-xs text-[#A3A7B0]">لا توجد إحداثيات موقع مسجلة للجهاز حتى الآن.</p>
                <p className="text-[10px] text-[#A3A7B0]/60 mt-1">تأكد من إعطاء صلاحية الموقع في تطبيق الآيفون وتفعيل مشاركة GPS.</p>
              </div>
            )}
          </div>
        </div>

        {/* Permissions & Security Status Column */}
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#171A20] p-5 rounded-2xl">
            <h2 className="text-md font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <span>🛡️</span> حالة الأذونات والموافقات الصريحة
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-[#171A20] rounded-lg">
                <span className="text-[#F5F5F5]">تتبع الموقع (GPS):</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${permissions?.location_granted ? 'bg-[#36B37E]/10 text-[#36B37E]' : 'bg-[#E05260]/10 text-[#E05260]'}`}>
                  {permissions?.location_granted ? 'ممنوح' : 'غير ممنوح'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#171A20] rounded-lg">
                <span className="text-[#F5F5F5]">مشاركة الشاشة (ReplayKit):</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${permissions?.screen_share_granted ? 'bg-[#36B37E]/10 text-[#36B37E]' : 'bg-[#E6AD45]/10 text-[#E6AD45]'}`}>
                  {permissions?.screen_share_granted ? 'ممنوح' : 'يتطلب موافقة'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#171A20] rounded-lg">
                <span className="text-[#F5F5F5]">الكاميرا والميكروفون:</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${permissions?.camera_granted ? 'bg-[#36B37E]/10 text-[#36B37E]' : 'bg-[#A3A7B0]/10 text-[#A3A7B0]'}`}>
                  {permissions?.camera_granted ? 'ممنوح' : 'معطل'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#171A20]">
              <span className="text-[10px] text-[#A3A7B0] block leading-relaxed">
                جميع البيانات المنقولة يتم استقبالها بموافقة صريحة ومباشرة من صاحب الآيفون وفقاً لإرشادات Apple الرسمية وسياسات الأمان الخاصة بـ Supabase RLS.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
  }
  
