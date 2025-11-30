import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function runIntegrationTests() {
  console.log('\n🔗 FIBERTRACE INTEGRATION TESTS (Modules A-M + Performance/Advanced)\n');
  
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

  let userId = 0, routeId = 0, closureId = 0;

  // ===== MODULES A-M =====
  await test('Auth: Register', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Performance Test',
        email: `perf${Date.now()}@test.com`,
        password: 'test123456',
        role: 'technician'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    userId = data.user.id;
  });

  await test('Routes: Create', async () => {
    const res = await fetch(`${API_BASE}/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route_name: 'Perf Test Route',
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

  await test('Closures: Create', async () => {
    const res = await fetch(`${API_BASE}/api/closures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        closure_name: 'Perf FAT',
        closure_type: 'FAT',
        latitude: 40.7128,
        longitude: -74.006,
        route_id: routeId,
        created_by: userId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    closureId = data.id;
  });

  await test('Splices: Create', async () => {
    const res = await fetch(`${API_BASE}/api/closures/${closureId}/splices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fiber_in: 1,
        fiber_out: 1,
        loss_reading: 0.15,
        created_by: userId
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await test('Power: Calculate', async () => {
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
  });

  await test('Reports: Export Route CSV', async () => {
    const res = await fetch(`${API_BASE}/api/reports/route/${routeId}/export`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const csv = await res.text();
    if (!csv.includes('Route Report')) throw new Error('Invalid CSV');
  });

  await test('Sync: Batch with ID Mapping', async () => {
    const res = await fetch(`${API_BASE}/api/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientTime: new Date().toISOString(),
        items: [{
          clientId: 'client-1',
          operation: 'create',
          resource: 'route',
          payload: { route_name: 'Test', cable_type: 'SM 12F', core_count: 12, total_length_meters: 1000, created_by: userId }
        }]
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.idMap['client-1']) throw new Error('No ID mapping');
  });

  // ===== PERFORMANCE OPTIMIZATION (3) =====
  await test('Performance: Analytics Dashboard', async () => {
    const res = await fetch(`${API_BASE}/api/analytics/dashboard`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.timestamp) throw new Error('No timestamp');
    if (!data.database) throw new Error('No database stats');
  });

  await test('Performance: Query Metrics', async () => {
    const res = await fetch(`${API_BASE}/api/analytics/performance`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.queryMetrics) throw new Error('No metrics');
  });

  // ===== ADVANCED FEATURES (4) =====
  await test('Advanced: Analytics Events', async () => {
    const res = await fetch(`${API_BASE}/api/analytics`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.events) throw new Error('No events');
    if (typeof data.websockets !== 'number') throw new Error('Invalid websocket count');
  });

  await test('Advanced: Offline Sync Queue', async () => {
    const res = await fetch(`${API_BASE}/api/sync/queue`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (typeof data.queueSize !== 'number') throw new Error('Invalid queue size');
  });

  await test('Advanced: Broadcast Notification', async () => {
    const res = await fetch(`${API_BASE}/api/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'test_notification',
        data: { message: 'Test' }
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json() as any;
    if (!data.success) throw new Error('Broadcast failed');
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TEST RESULTS: ${passed}/${passed + failed} passed`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED! Modules A-M + Performance + Advanced = READY\n');
  }

  process.exit(failed === 0 ? 0 : 1);
}

runIntegrationTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
