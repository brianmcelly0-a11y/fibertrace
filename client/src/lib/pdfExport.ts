import { jsPDF } from "jspdf";
import type { SpliceRecord, PowerReading, FiberRoute } from "@shared/schema";

interface JobWithClient {
  id: number;
  clientName: string;
  address: string;
  type: string;
  status: string;
  scheduledDate: Date;
  notes?: string | null;
}

interface ReportData {
  jobs: JobWithClient[];
  spliceRecords?: SpliceRecord[];
  powerReadings?: PowerReading[];
  fiberRoutes?: FiberRoute[];
  dateRange?: { start: Date; end: Date };
}

export function generatePDFReport(data: ReportData, title: string = "FiberTrace Field Report"): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
  
  if (data.dateRange) {
    yPos += 5;
    doc.text(
      `Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );
  }

  yPos += 15;
  doc.setDrawColor(0, 150, 200);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Job Summary", 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const statusCounts = data.jobs.reduce((acc: any, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  doc.text(`Total Jobs: ${data.jobs.length}`, 15, yPos);
  yPos += 6;

  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`  ${status}: ${count}`, 20, yPos);
    yPos += 5;
  });

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Job Details", 15, yPos);
  yPos += 8;
  doc.setFont("helvetica", "normal");

  data.jobs.forEach((job, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(`${index + 1}. ${job.clientName}`, 15, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text(`   Address: ${job.address}`, 20, yPos);
    yPos += 4;
    doc.text(`   Type: ${job.type} | Status: ${job.status}`, 20, yPos);
    yPos += 4;
    doc.text(`   Scheduled: ${new Date(job.scheduledDate).toLocaleDateString()}`, 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
  });

  if (data.spliceRecords && data.spliceRecords.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Splice Records", 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    data.spliceRecords.forEach((splice) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${splice.fiber1} ↔ ${splice.fiber2}`, 15, yPos);
      yPos += 5;
      doc.setFontSize(9);
      if (splice.spliceLoss) {
        doc.text(`   Loss: ${splice.spliceLoss} dB | Quality: ${splice.spliceQuality}`, 20, yPos);
        yPos += 4;
      }
      if (splice.deviceName) {
        doc.text(`   Device: ${splice.deviceName}`, 20, yPos);
        yPos += 4;
      }
      yPos += 2;
      doc.setFontSize(10);
    });
  }

  if (data.fiberRoutes && data.fiberRoutes.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Fiber Routes", 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    data.fiberRoutes.forEach((route) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${route.name}`, 15, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(`   Linear: ${route.linearDistance}m | Routed: ${route.routedDistance}m`, 20, yPos);
      yPos += 4;
      doc.text(`   Cable Required: ${route.cableRequired}m | Estimated Loss: ${route.estimatedLoss} dB`, 20, yPos);
      yPos += 6;
      doc.setFontSize(10);
    });
  }

  if (data.powerReadings && data.powerReadings.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Power Readings", 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    data.powerReadings.forEach((reading) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${reading.nodeType} - Power: ${reading.outputPower} dBm`, 15, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(`   Status: ${reading.status}`, 20, yPos);
      yPos += 4;
      if (reading.totalLoss) {
        doc.text(`   Total Loss: ${reading.totalLoss} dB`, 20, yPos);
        yPos += 4;
      }
      yPos += 2;
      doc.setFontSize(10);
    });
  }

  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("FiberTrace - Fiber Optic Network Documentation", pageWidth / 2, yPos, { align: "center" });

  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function exportJobsToCSV(jobs: JobWithClient[]): void {
  const headers = ['ID', 'Client Name', 'Address', 'Type', 'Status', 'Scheduled Date', 'Notes'];
  const rows = jobs.map(job => [
    job.id,
    job.clientName,
    job.address,
    job.type,
    job.status,
    new Date(job.scheduledDate).toLocaleDateString(),
    job.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportInventoryToCSV(inventory: any[]): void {
  const headers = ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Status', 'Min Stock Level'];
  const rows = inventory.map(item => [
    item.id,
    item.name,
    item.category,
    item.quantity,
    item.unit,
    item.status,
    item.minStockLevel || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
