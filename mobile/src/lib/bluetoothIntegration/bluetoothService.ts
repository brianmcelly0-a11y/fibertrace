import { BluetoothDevice, BluetoothReading, BluetoothConnection } from './types';

let connectedDevices: BluetoothConnection[] = [];
let discoveredDevices: BluetoothDevice[] = [];
let readings: BluetoothReading[] = [];

export function startBluetoothScan(): string {
  const scanId = `scan-${Date.now()}`;
  
  // Mock discovered devices
  discoveredDevices = [
    { id: 'dev1', name: 'OTDR-001', type: 'OTDR', rssi: -45, isConnected: false, lastSeen: new Date().toISOString() },
    { id: 'dev2', name: 'PowerMeter-002', type: 'PowerMeter', rssi: -65, isConnected: false, lastSeen: new Date().toISOString() },
    { id: 'dev3', name: 'OTDR-003', type: 'OTDR', rssi: -55, isConnected: false, lastSeen: new Date().toISOString() },
  ];

  return scanId;
}

export function stopBluetoothScan(): void {
  // Stop scanning
}

export function connectToDevice(deviceId: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const device = discoveredDevices.find(d => d.id === deviceId);
      if (!device) {
        resolve(false);
        return;
      }

      const connection: BluetoothConnection = {
        deviceId,
        deviceName: device.name,
        status: 'connected',
        connectionTime: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
      };

      connectedDevices.push(connection);
      device.isConnected = true;
      resolve(true);
    }, 500);
  });
}

export function disconnectDevice(deviceId: string): void {
  connectedDevices = connectedDevices.filter(d => d.deviceId !== deviceId);
  const device = discoveredDevices.find(d => d.id === deviceId);
  if (device) {
    device.isConnected = false;
  }
}

export function getDiscoveredDevices(): BluetoothDevice[] {
  return [...discoveredDevices];
}

export function getConnectedDevices(): BluetoothConnection[] {
  return [...connectedDevices];
}

export async function readFromDevice(deviceId: string): Promise<BluetoothReading | null> {
  const device = discoveredDevices.find(d => d.id === deviceId);
  if (!device) return null;

  const reading: BluetoothReading = {
    deviceId,
    deviceName: device.name,
    value: Math.random() * 100,
    unit: device.type === 'PowerMeter' ? 'dBm' : 'dB',
    type: device.type === 'PowerMeter' ? 'power' : 'loss',
    timestamp: new Date().toISOString(),
  };

  readings.push(reading);
  return reading;
}

export function getReadings(deviceId?: string): BluetoothReading[] {
  if (deviceId) {
    return readings.filter(r => r.deviceId === deviceId);
  }
  return [...readings];
}

export function clearReadings(): void {
  readings = [];
}

export function getDeviceInfo(deviceId: string): BluetoothDevice | null {
  return discoveredDevices.find(d => d.id === deviceId) || null;
}

export function isDeviceConnected(deviceId: string): boolean {
  return connectedDevices.some(d => d.deviceId === deviceId);
}
