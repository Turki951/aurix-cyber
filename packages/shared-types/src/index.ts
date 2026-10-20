export type ConnectionStatus = 'online' | 'offline' | 'pending_setup';
export type PairingStatus = 'pending' | 'consumed' | 'expired';

export interface Device {
  id: string;
  owner_id: string;
  device_name: string;
  model_name: string;
  os_version: string;
  connection_status: ConnectionStatus;
  last_seen_at?: string;
  paired_at: string;
  created_at: string;
}

export interface DevicePermissions {
  id: string;
  device_id: string;
  location_granted: boolean;
  screen_share_granted: boolean;
  camera_granted: boolean;
  mic_granted: boolean;
  user_consent_active: boolean;
  updated_at: string;
}

export interface LocationUpdate {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  timestamp: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  account_id: string;
  device_id?: string;
  event_type: string;
  description: string;
  created_at: string;
}
