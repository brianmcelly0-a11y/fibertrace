import { Technician, Shift, JobAssignment, ScheduleMetrics, RouteOptimization } from './types';

export function assignJobToTechnician(
  jobId: string,
  technicianId: string,
  estimatedHours: number,
  priority: string
): JobAssignment {
  return {
    id: `ASSIGN-${Date.now()}`,
    jobId,
    technicianId,
    assignedDate: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + estimatedHours * 3600000).toISOString(),
    estimatedHours,
    priority: priority as any,
    status: 'Assigned',
  };
}

export function optimizeRoute(jobs: any[], currentLocation: { lat: number; lng: number }): RouteOptimization {
  // Simple nearest-neighbor optimization
  const jobIds = jobs.map(j => j.id);
  const optimized = [...jobIds].sort();
  const totalDistance = jobIds.length * 5; // Mock distance
  const estimatedTime = jobIds.length * 15; // Mock time in minutes

  return {
    jobIds,
    optimizedOrder: optimized,
    totalDistance,
    estimatedTime,
    savings: { distance: Math.round(totalDistance * 0.15), time: Math.round(estimatedTime * 0.2) },
  };
}

export function getTechnicianUtilization(technician: Technician, assignments: JobAssignment[]): number {
  const techAssignments = assignments.filter(a => a.technicianId === technician.id);
  const usedHours = techAssignments.reduce((acc, a) => acc + a.estimatedHours, 0);
  return (usedHours / technician.availableHoursPerWeek) * 100;
}

export function getScheduleMetrics(
  technicians: Technician[],
  assignments: JobAssignment[]
): ScheduleMetrics {
  const utilizations = technicians.map(t => getTechnicianUtilization(t, assignments));
  const avgUtil = utilizations.length > 0 ? utilizations.reduce((a, b) => a + b, 0) / utilizations.length : 0;
  const completed = assignments.filter(a => a.status === 'Completed').length;

  return {
    totalTechnicians: technicians.length,
    averageUtilization: avgUtil,
    scheduledJobs: assignments.filter(a => a.status !== 'Failed').length,
    unassignedJobs: 0,
    completionRate: (completed / Math.max(assignments.length, 1)) * 100,
    averageCompletionTime: 240, // Mock: 4 hours
  };
}

export function createShift(
  technicianId: string,
  date: string,
  startTime: string,
  endTime: string
): Shift {
  return {
    id: `SHIFT-${Date.now()}`,
    technicianId,
    date,
    startTime,
    endTime,
    status: 'Scheduled',
  };
}

export function assignJobsByAvailability(
  jobs: any[],
  technicians: Technician[],
  assignments: JobAssignment[]
): JobAssignment[] {
  const newAssignments: JobAssignment[] = [];

  for (const job of jobs) {
    const bestTech = technicians.reduce((best, tech) => {
      const util = getTechnicianUtilization(tech, assignments);
      const bestUtil = getTechnicianUtilization(best, assignments);
      return util < bestUtil ? tech : best;
    });

    if (bestTech) {
      newAssignments.push(assignJobToTechnician(job.id, bestTech.id, job.estimatedDuration / 3600, job.priority));
    }
  }

  return newAssignments;
}

export function getTeamWorkload(technicians: Technician[], assignments: JobAssignment[]): any[] {
  return technicians.map(tech => ({
    technician: tech.name,
    utilization: getTechnicianUtilization(tech, assignments),
    jobsAssigned: assignments.filter(a => a.technicianId === tech.id).length,
    status: getTechnicianUtilization(tech, assignments) > 90 ? 'Overbooked' : 'Available',
  }));
}
