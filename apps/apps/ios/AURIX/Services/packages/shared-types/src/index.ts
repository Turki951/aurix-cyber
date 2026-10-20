// packages/shared-types/src/index.ts
// AURIX Cyber Platform - Shared Data Contracts & DTOs

export type ConnectionStatus = 'online' | 'offline' | 'pending_setup';
export type PairingStatus = 'pending' | 'consumed' | 'expired';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

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

export interface PairingRequest {
  id: string;
  account_id: string;
  code_hash: string;
  status: PairingStatus;
  attempts: number;
  expires_at: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  account_id: string;
  device_id?: string;
  event_type: string;
  description: string;
  ip_address?: string;
  created_at: string;
}
