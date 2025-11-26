// Job management utilities for operational tuning
import { api } from './api';
import { calculateDistance, calculateTotalDistance } from './utils';

export interface JobConfig {
  type: string;
  address: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  scheduledDate: Date;
  completedDate?: Date;
  notes?: string;
  latitude?: number;
  longitude?: number;
  cableUsed?: string;
  materialsUsed?: string;
  selectedNodes?: number[];
  route?: [number, number][];
}

export interface OperationalUnit {
  id: number;
  jobId: number;
  nodeIds: number[];
  estimatedDistance: number;
  estimatedCable: number;
  powerImpact: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  startTime?: Date;
  endTime?: Date;
  efficiency: number; // 0-100
}

// Estimate cable needed based on route distance
export function estimateCableNeeded(distance: number): number {
  // Add 15% buffer for actual fiber routing
  return Math.ceil(distance * 1.15);
}

// Calculate route distance from GPS path
export function calculateRouteDistance(path: [number, number][]): number {
  return calculateTotalDistance(path);
}

// Create operational unit from job
export async function createOperationalUnit(
  job: JobConfig,
  gpsRoute: [number, number][]
): Promise<OperationalUnit> {
  const distance = calculateRouteDistance(gpsRoute);
  const cable = estimateCableNeeded(distance);
  
  const jobData = {
    type: job.type,
    address: job.address,
    status: job.status,
    scheduledDate: job.scheduledDate.toISOString(),
    latitude: job.latitude,
    longitude: job.longitude,
    notes: job.notes,
    cableUsed: cable.toString(),
    materialsUsed: job.materialsUsed,
    clientId: 1, // Default client
    technicianId: 1, // Default technician
  };

  const createdJob = await api.createJob(jobData);

  // Save fiber route
  if (gpsRoute.length > 1) {
    await api.saveFiberRoute({
      name: `${job.type} - ${job.address}`,
      routeType: 'GPS',
      coordinates: gpsRoute,
      distance,
      jobId: createdJob.id,
    });
  }

  return {
    id: createdJob.id,
    jobId: createdJob.id,
    nodeIds: job.selectedNodes || [],
    estimatedDistance: distance,
    estimatedCable: cable,
    powerImpact: calculatePowerImpact(job.selectedNodes || []),
    status: job.status,
    efficiency: 0,
  };
}

// Analyze power impact of selected nodes
function calculatePowerImpact(nodeIds: number[]): string {
  if (nodeIds.length === 0) return 'No nodes selected';
  if (nodeIds.length < 3) return 'Low - Few nodes';
  if (nodeIds.length < 6) return 'Medium - Multiple nodes';
  return 'High - Complex route';
}

// Update job status
export async function updateJobStatus(
  jobId: number,
  status: 'Pending' | 'In Progress' | 'Completed'
): Promise<any> {
  const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update job');
  return res.json();
}

// Estimate time to complete based on complexity
export function estimateCompletionTime(distance: number, nodeCount: number): number {
  // Base time: 30 minutes + 10 min per km + 5 min per node
  const baseTime = 30;
  const distanceTime = Math.ceil(distance * 10);
  const nodeTime = nodeCount * 5;
  return baseTime + distanceTime + nodeTime;
}

// Format job summary for display
export function formatJobSummary(unit: OperationalUnit): string {
  return `
Nodes: ${unit.nodeIds.length}
Distance: ${unit.estimatedDistance.toFixed(1)} km
Cable: ${unit.estimatedCable} m
Impact: ${unit.powerImpact}
Status: ${unit.status}
  `.trim();
}
