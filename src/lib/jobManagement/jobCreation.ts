import { Job, JobStatus } from './types';

export function generateJobId(): string {
  const prefix = 'JOB';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function createJob(
  name: string,
  description: string,
  assignedTechnician: string,
  nodeIds: string[],
  routeIds: string[],
  scheduledDate: string,
  scheduledTime: string,
  estimatedDuration: number,
  priority: 'Low' | 'Medium' | 'High' | 'Critical',
  materialRequired: { itemId: string; quantity: number }[],
  estimatedCost: number
): Job {
  const jobId = generateJobId();
  const now = new Date().toISOString();

  return {
    id: jobId,
    jobId,
    name,
    description,
    status: 'Pending',
    priority,
    assignedTechnician,
    techniciansTeam: [assignedTechnician],
    nodeIds,
    routeIds,
    scheduledDate,
    scheduledTime,
    duration: 0,
    estimatedDuration,
    materialRequired,
    estimatedCost,
    notes: '',
    inlineNotes: [],
    createdAt: now,
    updatedAt: now,
    unsyncedChanges: true,
  };
}

export function validateJobCreation(
  name: string,
  assignedTechnician: string,
  scheduledDate: string,
  estimatedDuration: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Job name is required');
  }

  if (!assignedTechnician || assignedTechnician.trim().length === 0) {
    errors.push('Technician assignment is required');
  }

  if (!scheduledDate || new Date(scheduledDate) < new Date()) {
    errors.push('Scheduled date must be in the future');
  }

  if (estimatedDuration <= 0) {
    errors.push('Estimated duration must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function duplicateJob(job: Job): Job {
  const newJob = { ...job };
  newJob.id = generateJobId();
  newJob.jobId = newJob.id;
  newJob.status = 'Pending';
  newJob.duration = 0;
  newJob.completionDate = undefined;
  newJob.completionTime = undefined;
  newJob.actualCost = undefined;
  newJob.createdAt = new Date().toISOString();
  newJob.updatedAt = new Date().toISOString();
  newJob.unsyncedChanges = true;
  newJob.inlineNotes = [];
  return newJob;
}
