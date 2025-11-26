import { Customer, ONTReading, ServiceType, CustomerStatus, CustomerStats } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fibertrace_customers';

export async function loadCustomers(): Promise<Customer[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load customers:', error);
    return [];
  }
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error('Failed to save customers:', error);
  }
}

export function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, technicianId: string): Customer {
  return {
    ...data,
    id: `customer-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: technicianId,
    ontPowerReadings: [],
    synced: false,
  };
}

export async function addCustomer(customer: Customer): Promise<void> {
  const customers = await loadCustomers();
  customers.push(customer);
  await saveCustomers(customers);
}

export async function updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
  const customers = await loadCustomers();
  const index = customers.findIndex(c => c.id === customerId);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...updates, updatedAt: new Date().toISOString() };
    await saveCustomers(customers);
  }
}

export async function addONTReading(customerId: string, reading: ONTReading): Promise<void> {
  const customers = await loadCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (customer) {
    customer.ontPowerReadings.push(reading);
    customer.currentPowerLevel = reading.powerLevel;
    customer.updatedAt = new Date().toISOString();
    await saveCustomers(customers);
  }
}

export function getONTPowerTrend(customer: Customer): { current: number; min: number; max: number; average: number } {
  if (customer.ontPowerReadings.length === 0) {
    return { current: 0, min: 0, max: 0, average: 0 };
  }

  const readings = customer.ontPowerReadings.map(r => r.powerLevel);
  return {
    current: readings[readings.length - 1],
    min: Math.min(...readings),
    max: Math.max(...readings),
    average: readings.reduce((a, b) => a + b, 0) / readings.length,
  };
}

export function checkPowerHealth(customer: Customer): { status: 'Healthy' | 'Warning' | 'Critical'; message: string } {
  const powerTrend = getONTPowerTrend(customer);
  
  if (powerTrend.current < customer.minThresholdPower) {
    return { status: 'Critical', message: `Power below minimum (${powerTrend.current.toFixed(1)} dBm)` };
  }
  
  if (powerTrend.current < customer.alertThreshold) {
    return { status: 'Warning', message: `Power approaching alert threshold (${powerTrend.current.toFixed(1)} dBm)` };
  }
  
  return { status: 'Healthy', message: 'Power levels nominal' };
}

export async function getCustomersByFAT(fatId: string): Promise<Customer[]> {
  const customers = await loadCustomers();
  return customers.filter(c => c.fatId === fatId);
}

export async function getCustomersByServiceType(type: ServiceType): Promise<Customer[]> {
  const customers = await loadCustomers();
  return customers.filter(c => c.serviceType === type);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const customers = await loadCustomers();
  const lowerQuery = query.toLowerCase();
  return customers.filter(c =>
    c.customerId.toLowerCase().includes(lowerQuery) ||
    c.name.toLowerCase().includes(lowerQuery) ||
    c.accountNumber.toLowerCase().includes(lowerQuery) ||
    c.address.toLowerCase().includes(lowerQuery)
  );
}

export function getCustomerStats(customers: Customer[]): CustomerStats {
  const byServiceType: Record<ServiceType, number> = {
    Residential: 0,
    Commercial: 0,
    Industrial: 0,
  };

  customers.forEach(c => {
    byServiceType[c.serviceType] = (byServiceType[c.serviceType] || 0) + 1;
  });

  const ontOfflineCount = customers.filter(c => {
    const lastReading = c.ontPowerReadings[c.ontPowerReadings.length - 1];
    return lastReading?.status === 'Offline';
  }).length;

  const lowPowerCount = customers.filter(c => {
    const powerTrend = getONTPowerTrend(c);
    return powerTrend.current < c.alertThreshold;
  }).length;

  return {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'Active').length,
    byServiceType,
    totalDropLength: customers.reduce((sum, c) => sum + c.dropCableLength, 0),
    ontOfflineCount,
    lowPowerCount,
  };
}

export async function generateCustomerServiceReport(customerId: string): Promise<string> {
  const customers = await loadCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return '';

  const powerTrend = getONTPowerTrend(customer);
  const powerHealth = checkPowerHealth(customer);

  return `
Customer Service Report
Customer: ${customer.name}
Account: ${customer.accountNumber}
Service Type: ${customer.serviceType}
Status: ${customer.status}

Service Details:
- Address: ${customer.address}
- Drop Cable Length: ${customer.dropCableLength}m
- Cable Type: ${customer.cableType}

ONT Information:
- Serial: ${customer.ontSerialNumber || 'N/A'}
- Model: ${customer.ontModel || 'N/A'}

Power Analysis:
- Current: ${powerTrend.current.toFixed(1)} dBm
- Min: ${powerTrend.min.toFixed(1)} dBm
- Max: ${powerTrend.max.toFixed(1)} dBm
- Average: ${powerTrend.average.toFixed(1)} dBm
- Health: ${powerHealth.status} - ${powerHealth.message}

Readings: ${customer.ontPowerReadings.length} total

Notes: ${customer.notes}
  `.trim();
}
