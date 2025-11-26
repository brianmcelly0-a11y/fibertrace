export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'OTDR' | 'PowerMeter' | 'Other';
  rssi: number;
  isConnected: boolean;
  lastSeen: string;
}

export interface BluetoothReading {
  deviceId: string;
  deviceName: string;
  value: number;
  unit: string;
  type: 'loss' | 'power' | 'wavelength';
  timestamp: string;
}

export interface BluetoothConnection {
  deviceId: string;
  deviceName: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionTime: string;
  lastHeartbeat: string;
}

export interface DeviceCharacteristic {
  uuid: string;
  name: string;
  readable: boolean;
  writable: boolean;
}
