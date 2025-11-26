// Accessibility utilities for better mobile app usability

export interface AccessibilityLabel {
  label: string;
  hint?: string;
  role?: string;
}

export function createAccessibilityLabel(label: string, hint?: string, role?: string): AccessibilityLabel {
  return { label, hint, role };
}

export const accessibilityLabels = {
  // Job Management
  jobCard: createAccessibilityLabel('Job card', 'Double tap to view job details'),
  jobTitle: createAccessibilityLabel('Job title'),
  jobStatus: createAccessibilityLabel('Job status'),
  jobPriority: createAccessibilityLabel('Job priority level'),
  createJobButton: createAccessibilityLabel('Create new job', 'Opens job creation form', 'button'),

  // Navigation
  backButton: createAccessibilityLabel('Go back', 'Returns to previous screen', 'button'),
  searchButton: createAccessibilityLabel('Search', 'Opens search functionality', 'button'),
  settingsButton: createAccessibilityLabel('Settings', 'Opens application settings', 'button'),

  // Tracking
  startTrackingButton: createAccessibilityLabel('Start tracking', 'Begin GPS tracking session', 'button'),
  stopTrackingButton: createAccessibilityLabel('Stop tracking', 'End GPS tracking session', 'button'),
  trackingStatus: createAccessibilityLabel('Tracking status', 'Shows current tracking state'),

  // Reports
  generateReportButton: createAccessibilityLabel('Generate report', 'Create new report', 'button'),
  exportButton: createAccessibilityLabel('Export', 'Export report to file', 'button'),

  // General
  loadingIndicator: createAccessibilityLabel('Loading', 'Content is loading'),
  errorMessage: createAccessibilityLabel('Error', 'An error occurred'),
  successMessage: createAccessibilityLabel('Success', 'Operation completed'),
};

export function getAccessibilityProps(label: AccessibilityLabel): Record<string, any> {
  return {
    accessible: true,
    accessibilityLabel: label.label,
    accessibilityHint: label.hint,
    accessibilityRole: label.role || 'button',
  };
}
