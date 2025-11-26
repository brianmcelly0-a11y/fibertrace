export interface Technician {
  id: string;
  name: string;
  email: string;
  role: 'Technician' | 'Team Lead' | 'Manager';
  availableHoursPerWeek: number;
  currentUtilization: number;
  skills: string[];
}

export interface Shift {
  id: string;
  technicianId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface JobAssignment {
  id: string;
  jobId: string;
  technicianId: string;
  assignedDate: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Failed';
}

export interface ScheduleMetrics {
  totalTechnicians: number;
  averageUtilization: number;
  scheduledJobs: number;
  unassignedJobs: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface RouteOptimization {
  jobIds: string[];
  optimizedOrder: string[];
  totalDistance: number;
  estimatedTime: number;
  savings: { distance: number; time: number };
}
