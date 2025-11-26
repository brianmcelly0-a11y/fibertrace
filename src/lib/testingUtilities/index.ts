// Test utilities and helpers for mobile app testing

export function createMockJob(overrides?: any) {
  return {
    id: 'j1',
    jobId: 'JOB-001',
    name: 'Test Job',
    description: 'Test description',
    status: 'Pending',
    priority: 'High',
    assignedTechnician: 'John Doe',
    ...overrides,
  };
}

export function createMockNode(overrides?: any) {
  return {
    id: 'n1',
    nodeId: 'NODE-001',
    name: 'Test Node',
    type: 'OLT',
    latitude: 40.7128,
    longitude: -74.006,
    status: 'Active',
    ...overrides,
  };
}

export function createMockRoute(overrides?: any) {
  return {
    id: 'r1',
    routeId: 'ROUTE-001',
    name: 'Test Route',
    type: 'Backbone',
    startNode: 'NODE-001',
    endNode: 'NODE-002',
    distance: 1250,
    ...overrides,
  };
}

export function createMockInventoryItem(overrides?: any) {
  return {
    id: 'inv1',
    itemId: 'INV-001',
    name: 'Test Item',
    type: 'Cable',
    currentStock: 50,
    minimumStock: 10,
    costPerUnit: 100,
    ...overrides,
  };
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function expectToEqual<T>(actual: T, expected: T, message?: string): boolean {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  if (!passed && message) {
    console.error(`Test failed: ${message}. Expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`);
  }
  return passed;
}

export function expectToContain(text: string, substring: string, message?: string): boolean {
  const passed = text.includes(substring);
  if (!passed && message) {
    console.error(`Test failed: ${message}`);
  }
  return passed;
}

export function runTests(testFn: () => Promise<void>): Promise<void> {
  return testFn();
}
