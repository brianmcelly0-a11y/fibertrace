import { Job, JobStatus } from './types';

export function updateJobStatus(job: Job, newStatus: JobStatus): Job {
  const updated = { ...job };
  updated.status = newStatus;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;

  if (newStatus === 'In Progress' && !job.duration) {
    updated.duration = 0;
  }

  if (newStatus === 'Completed') {
    updated.completionDate = new Date().toISOString().split('T')[0];
    updated.completionTime = new Date().toISOString().split('T')[1].slice(0, 5);
  }

  return updated;
}

export function updateJobNotes(job: Job, notes: string): Job {
  const updated = { ...job };
  updated.notes = notes;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function addInlineNote(job: Job, text: string, author: string): Job {
  const updated = { ...job };
  const newNote = {
    id: `note-${Date.now()}`,
    timestamp: new Date().toISOString(),
    text,
    author,
  };
  updated.inlineNotes = [...updated.inlineNotes, newNote];
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function updateJobDuration(job: Job, durationSeconds: number): Job {
  const updated = { ...job };
  updated.duration = durationSeconds;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function updateJobCost(job: Job, actualCost: number): Job {
  const updated = { ...job };
  updated.actualCost = actualCost;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function updateJobMaterials(job: Job, materials: { itemId: string; quantity: number }[]): Job {
  const updated = { ...job };
  updated.materialRequired = materials;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function reassignJob(job: Job, newTechnician: string): Job {
  const updated = { ...job };
  updated.assignedTechnician = newTechnician;
  if (!updated.techniciansTeam?.includes(newTechnician)) {
    updated.techniciansTeam = [...(updated.techniciansTeam || []), newTechnician];
  }
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function changeJobPriority(job: Job, priority: 'Low' | 'Medium' | 'High' | 'Critical'): Job {
  const updated = { ...job };
  updated.priority = priority;
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}

export function deleteInlineNote(job: Job, noteId: string): Job {
  const updated = { ...job };
  updated.inlineNotes = updated.inlineNotes.filter(n => n.id !== noteId);
  updated.updatedAt = new Date().toISOString();
  updated.unsyncedChanges = true;
  return updated;
}
