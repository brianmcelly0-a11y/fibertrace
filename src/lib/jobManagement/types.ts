export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type JobPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Job {
  id: string;
  jobId: string;
  name: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  assignedTechnician: string;
  techniciansTeam?: string[];
  nodeIds: string[];
  routeIds: string[];
  scheduledDate: string;
  scheduledTime: string;
  completionDate?: string;
  completionTime?: string;
  duration: number;
  estimatedDuration: number;
  materialRequired: { itemId: string; quantity: number }[];
  estimatedCost: number;
  actualCost?: number;
  notes: string;
  inlineNotes: InlineNote[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  unsyncedChanges: boolean;
}

export interface InlineNote {
  id: string;
  timestamp: string;
  text: string;
  author: string;
}

export interface JobStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalDurationHours: number;
  totalCost: number;
  averageCompletionTime: number;
  unsyncedCount: number;
}

export interface JobTimerState {
  jobId: string;
  isRunning: boolean;
  elapsedSeconds: number;
  pausedAt?: number;
}
