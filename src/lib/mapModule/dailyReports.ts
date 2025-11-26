// Workflow 8: DAILY REPORTS - Action logging, timestamps, GPS stamps, exports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyReport, ReportAction, GeoPoint } from './types';

const REPORTS_STORAGE_KEY = 'map_daily_reports';
const ACTIONS_STORAGE_KEY = 'map_report_actions';

export async function recordReportAction(
  type: ReportAction['type'],
  details: Record<string, any>,
  location: GeoPoint,
  nodeId?: string
): Promise<ReportAction> {
  const action: ReportAction = {
    type,
    timestamp: Date.now(),
    location,
    nodeId,
    details,
    gpsStamp: location,
  };

  try {
    const stored = await AsyncStorage.getItem(ACTIONS_STORAGE_KEY);
    const actions: ReportAction[] = stored ? JSON.parse(stored) : [];
    actions.push(action);
    await AsyncStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Error recording report action:', error);
  }

  return action;
}

export async function generateDailyReport(
  date: string,
  technicianId: string
): Promise<DailyReport> {
  try {
    const stored = await AsyncStorage.getItem(ACTIONS_STORAGE_KEY);
    const actions: ReportAction[] = stored ? JSON.parse(stored) : [];

    // Filter actions for this technician and date
    const dateStart = new Date(date).getTime();
    const dateEnd = dateStart + 86400000; // 24 hours

    const dayActions = actions.filter(
      (a) => a.timestamp >= dateStart && a.timestamp < dateEnd && (a as any).technicianId === technicianId
    );

    const nodesAdded = dayActions.filter((a) => a.type === 'node_add').length;
    const powerReadings = dayActions.filter((a) => a.type === 'power_read').length;
    const jobsCompleted = dayActions.filter((a) => a.type === 'splice_loss').length;

    let totalDistance = 0;
    dayActions.forEach((a) => {
      if (a.details.distance) {
        totalDistance += a.details.distance;
      }
    });

    const report: DailyReport = {
      id: `report-${Date.now()}`,
      date,
      technicianId,
      actions: dayActions,
      totalDistance,
      nodesAdded,
      powerReadings,
      jobsCompleted,
    };

    await saveReport(report);
    return report;
  } catch (error) {
    console.error('Error generating daily report:', error);
    return {
      id: '',
      date,
      technicianId,
      actions: [],
      totalDistance: 0,
      nodesAdded: 0,
      powerReadings: 0,
      jobsCompleted: 0,
    };
  }
}

async function saveReport(report: DailyReport): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
    const reports: DailyReport[] = stored ? JSON.parse(stored) : [];
    reports.push(report);
    await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving report:', error);
  }
}

export async function getReport(reportId: string): Promise<DailyReport | null> {
  try {
    const stored = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
    if (stored) {
      const reports: DailyReport[] = JSON.parse(stored);
      return reports.find((r) => r.id === reportId) || null;
    }
  } catch (error) {
    console.error('Error getting report:', error);
  }
  return null;
}

export function generateReportCSV(report: DailyReport): string {
  let csv = `Date,Technician,Total Distance (km),Nodes Added,Power Readings,Jobs Completed\n`;
  csv += `${report.date},${report.technicianId},${report.totalDistance.toFixed(2)},${report.nodesAdded},${report.powerReadings},${report.jobsCompleted}\n\n`;

  csv += `Action Details:\nType,Timestamp,Node ID,Details\n`;
  report.actions.forEach((action) => {
    csv += `${action.type},${new Date(action.timestamp).toISOString()},${action.nodeId || 'N/A'},${JSON.stringify(action.details).replace(/,/g, ';')}\n`;
  });

  return csv;
}

export function generateReportJSON(report: DailyReport): string {
  return JSON.stringify(report, null, 2);
}
