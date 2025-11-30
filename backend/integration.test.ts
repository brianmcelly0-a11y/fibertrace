import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function runIntegrationTests() {
  console.log('\n🔗 FRONTEND + BACKEND INTEGRATION TEST (ALL MODULES)\n');
  
  let passed = 0, failed = 0;
  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  };

  let userId = 0, token = '', routeId = 0, closureId = 0, jobId = 0, inventoryId = 0;

  // ===== MODULES A-K (Original Tests) =====
  await test('Register User', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Integration Test',
        email: `test${Date.now()}@test.com`,
        password: 'test123456',
        role: 'technician'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    userId = data.user.id;
    token = data.token;
    if (!userId || !token) throw new Error('No user or token');
  });

  await test('Create Route', async () => {
    const res = await fetch(`${API_BASE}/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route_name: 'Integration Test Route',
        cable_type: 'SM 12F',
        core_count: 12,
        total_length_meters: 5000,
        created_by: userId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    routeId = data.id;
  });

  await test('Create Closure', async () => {
    const res = await fetch(`${API_BASE}/api/closures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        closure_name: 'Test FAT',
        closure_type: 'FAT',
        latitude: 40.7128,
        longitude: -74.006,
        route_id: routeId,
        fiber_count: 12,
        capacity_total: 8,
        created_by: userId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    closureId = data.id;
  });

  await test('Create Splice in Closure', async () => {
    const res = await fetch(`${API_BASE}/api/closures/${closureId}/splices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fiber_in: 1,
        fiber_out: 1,
        color_in: 'red',
        color_out: 'red',
        loss_reading: 0.15,
        created_by: userId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await test('Get Closure with Splices', async () => {
    const res = await fetch(`${API_BASE}/api/closures/${closureId}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.closure) throw new Error('No closure');
    if (!Array.isArray(data.splices)) throw new Error('No splices array');
  });

  await test('Calculate Power Chain', async () => {
    const res = await fetch(`${API_BASE}/api/power/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeId: routeId,
        inputPowerDbm: 0,
        fiberLength: 5000
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!Array.isArray(data.nodes)) throw new Error('No power nodes');
  });

  await test('Create Job', async () => {
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_title: 'Test Job',
        job_type: 'Maintenance',
        assigned_to: userId,
        route_id: routeId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    jobId = data.id;
  });

  await test('Log Job Action', async () => {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'inspection',
        details: { findings: 'All good' },
        splicesDone: 1
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await test('Create Inventory', async () => {
    const res = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: 'Fusion Splicer',
        item_type: 'tool',
        serial_number: 'FS-001'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    inventoryId = data.id;
  });

  await test('Assign Inventory to Job', async () => {
    const res = await fetch(`${API_BASE}/api/inventory/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: inventoryId,
        userId: userId,
        jobId: jobId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await test('Protected Endpoint with JWT', async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (data.user.id !== userId) throw new Error('Wrong user');
  });

  // ===== MODULE L (Reports) =====
  await test('Export Route as CSV (Module L)', async () => {
    const res = await fetch(`${API_BASE}/api/reports/route/${routeId}/export?format=csv`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const csv = await res.text();
    if (!csv.includes('Route Report')) throw new Error('Invalid CSV format');
  });

  await test('Get Daily Reports (Module L)', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${API_BASE}/api/reports/daily?date=${today}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!Array.isArray(data.reports)) throw new Error('Invalid reports array');
  });

  // ===== MODULE M (Batch Sync) =====
  await test('Batch Sync with ID Mapping (Module M)', async () => {
    const res = await fetch(`${API_BASE}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientTime: new Date().toISOString(),
        items: [
          {
            clientId: 'client-route-sync-1',
            operation: 'create',
            resource: 'route',
            payload: { route_name: 'Sync Test Route', cable_type: 'SM 12F', core_count: 12, total_length_meters: 2000, created_by: userId }
          }
        ]
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.idMap) throw new Error('No ID map in response');
    if (!data.idMap['client-route-sync-1']) throw new Error('Client ID not mapped to server ID');
  });

  await test('Resolve Sync Conflict (Module M)', async () => {
    const res = await fetch(`${API_BASE}/api/sync/resolve-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'test-conflict',
        resolution: 'keep-server',
        clientVersion: 1,
        serverVersion: 2
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (data.resolution !== 'keep-server') throw new Error('Conflict not resolved correctly');
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Integration Test Results: ${passed}/${passed + failed} passed`);
  console.log(`${'='.repeat(50)}\n`);

  if (failed === 0) {
    console.log('✅ ALL INTEGRATION TESTS PASSED!\n');
    console.log('Modules A-M (Full Spec) = FULLY OPERATIONAL\n');
  }

  process.exit(failed === 0 ? 0 : 1);
}

runIntegrationTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
