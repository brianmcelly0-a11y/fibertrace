import { Job } from './types';

export interface CompletionData {
  durationSeconds: number;
  actualCost: number;
  notes: string;
  signedBy: string;
}

export function completeJob(job: Job, data: CompletionData): Job {
  if (job.status === 'Completed') {
    return job;
  }

  const now = new Date();
  const updated = { ...job };

  updated.status = 'Completed';
  updated.completionDate = now.toISOString().split('T')[0];
  updated.completionTime = now.toISOString().split('T')[1].slice(0, 5);
  updated.duration = data.durationSeconds;
  updated.actualCost = data.actualCost;
  updated.notes = data.notes;
  updated.updatedAt = now.toISOString();
  updated.unsyncedChanges = true;

  return updated;
}

export function canCompleteJob(job: Job): { canComplete: boolean; reason?: string } {
  if (job.status === 'Cancelled') {
    return { canComplete: false, reason: 'Cannot complete a cancelled job' };
  }

  if (job.status === 'Completed') {
    return { canComplete: false, reason: 'Job is already completed' };
  }

  return { canComplete: true };
}

export function generateCompletionReport(job: Job): {
  jobId: string;
  name: string;
  technician: string;
  duration: string;
  estimatedVsActual: string;
  costVariance: string;
  materialUsed: number;
  status: string;
} {
  const estimatedHours = (job.estimatedDuration / 3600).toFixed(2);
  const actualHours = (job.duration / 3600).toFixed(2);
  const costVariance = ((job.actualCost || 0) - job.estimatedCost).toFixed(2);
  const materialUsed = job.materialRequired.reduce((acc, m) => acc + m.quantity, 0);

  return {
    jobId: job.jobId,
    name: job.name,
    technician: job.assignedTechnician,
    duration: `${actualHours}h (est: ${estimatedHours}h)`,
    estimatedVsActual: job.duration > job.estimatedDuration ? '+' : '-' + 'variance',
    costVariance: `$${costVariance}`,
    materialUsed,
    status: job.status,
  };
}

export function getJobMetrics(completedJobs: Job[]): {
  averageCompletionTime: number;
  costOverrunPercentage: number;
  onTimePercentage: number;
  totalJobsCompleted: number;
} {
  if (completedJobs.length === 0) {
    return { averageCompletionTime: 0, costOverrunPercentage: 0, onTimePercentage: 0, totalJobsCompleted: 0 };
  }

  const avgTime = completedJobs.reduce((acc, j) => acc + j.duration, 0) / completedJobs.length;
  const overruns = completedJobs.filter(j => (j.actualCost || 0) > j.estimatedCost).length;
  const onTime = completedJobs.filter(j => j.duration <= j.estimatedDuration).length;

  return {
    averageCompletionTime: avgTime,
    costOverrunPercentage: (overruns / completedJobs.length) * 100,
    onTimePercentage: (onTime / completedJobs.length) * 100,
    totalJobsCompleted: completedJobs.length,
  };
}
