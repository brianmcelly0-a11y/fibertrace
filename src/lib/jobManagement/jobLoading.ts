import { Job, JobStats } from './types';

export function loadJobs(jobs: Job[]): Job[] {
  return jobs.sort((a, b) => {
    const dateA = new Date(a.scheduledDate).getTime();
    const dateB = new Date(b.scheduledDate).getTime();
    return dateB - dateA;
  });
}

export function filterJobsByStatus(jobs: Job[], status: string): Job[] {
  return jobs.filter(job => job.status === status);
}

export function filterJobsByTechnician(jobs: Job[], technicianId: string): Job[] {
  return jobs.filter(job => job.assignedTechnician === technicianId || job.techniciansTeam?.includes(technicianId));
}

export function filterJobsByDateRange(jobs: Job[], startDate: string, endDate: string): Job[] {
  return jobs.filter(job => {
    const jobDate = new Date(job.scheduledDate).getTime();
    return jobDate >= new Date(startDate).getTime() && jobDate <= new Date(endDate).getTime();
  });
}

export function searchJobs(jobs: Job[], query: string): Job[] {
  const lower = query.toLowerCase();
  return jobs.filter(job =>
    job.name.toLowerCase().includes(lower) ||
    job.jobId.toLowerCase().includes(lower) ||
    job.description.toLowerCase().includes(lower)
  );
}

export function sortJobs(jobs: Job[], field: 'date' | 'priority' | 'status' | 'duration'): Job[] {
  const sorted = [...jobs];
  
  switch (field) {
    case 'priority':
      const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return sorted.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
    case 'status':
      const statusOrder = { 'In Progress': 0, 'Pending': 1, 'On Hold': 2, 'Completed': 3, 'Cancelled': 4 };
      return sorted.sort((a, b) => statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]);
    case 'duration':
      return sorted.sort((a, b) => b.estimatedDuration - a.estimatedDuration);
    default:
      return sorted;
  }
}

export function getJobStats(jobs: Job[]): JobStats {
  const totalDuration = jobs.reduce((acc, job) => acc + (job.duration || 0), 0);
  const totalCost = jobs.reduce((acc, job) => acc + (job.actualCost || job.estimatedCost), 0);
  const completedJobs = jobs.filter(j => j.status === 'Completed');
  const avgCompletion = completedJobs.length > 0
    ? completedJobs.reduce((acc, job) => acc + (job.estimatedDuration || 0), 0) / completedJobs.length
    : 0;

  return {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter(j => j.status === 'Pending').length,
    inProgressJobs: jobs.filter(j => j.status === 'In Progress').length,
    completedJobs: completedJobs.length,
    cancelledJobs: jobs.filter(j => j.status === 'Cancelled').length,
    totalDurationHours: totalDuration,
    totalCost,
    averageCompletionTime: avgCompletion,
    unsyncedCount: jobs.filter(j => j.unsyncedChanges).length,
  };
}

export function getJobById(jobs: Job[], jobId: string): Job | undefined {
  return jobs.find(j => j.id === jobId);
}
