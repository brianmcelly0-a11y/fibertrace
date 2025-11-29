import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PermissionStatus {
  bluetooth: boolean;
  location: boolean;
  camera: boolean;
  microphone: boolean;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
}

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // On Android, Bluetooth is usually available through location permission
    return await requestLocationPermission();
  } catch (error) {
    console.error('Bluetooth permission error:', error);
    return false;
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const response = await fetch('https://localhost/permission/camera');
    return response.ok;
  } catch {
    return false;
  }
}

export async function savePermissionPreference(permission: string, granted: boolean): Promise<void> {
  await AsyncStorage.setItem(`permission_${permission}`, JSON.stringify(granted));
}

export async function getPermissionPreference(permission: string): Promise<boolean> {
  const saved = await AsyncStorage.getItem(`permission_${permission}`);
  return saved ? JSON.parse(saved) : false;
}

export async function getAllPermissions(): Promise<PermissionStatus> {
  return {
    bluetooth: await getPermissionPreference('bluetooth'),
    location: await getPermissionPreference('location'),
    camera: await getPermissionPreference('camera'),
    microphone: await getPermissionPreference('microphone'),
  };
}
