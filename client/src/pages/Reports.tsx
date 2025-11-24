import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, Mail } from "lucide-react";
import { format, subDays } from "date-fns";
import { generatePDFReport, exportJobsToCSV } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getAll,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const handleExportPDF = () => {
    try {
      const clientMap = new Map(clients.map(c => [c.id, c.name]));
      const jobsWithClients = jobs.map(job => ({
        id: job.id,
        clientName: clientMap.get(job.clientId) || 'Unknown Client',
        address: job.address,
        type: job.type,
        status: job.status,
        scheduledDate: new Date(job.scheduledDate),
        notes: job.notes,
      }));

      const dateRange = {
        start: subDays(new Date(), 7),
        end: new Date(),
      };

      generatePDFReport({ jobs: jobsWithClients, dateRange }, "Weekly Field Report");
      
      toast({
        title: "PDF Exported",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const clientMap = new Map(clients.map(c => [c.id, c.name]));
      const jobsWithClients = jobs.map(job => ({
        id: job.id,
        clientName: clientMap.get(job.clientId) || 'Unknown Client',
        address: job.address,
        type: job.type,
        status: job.status,
        scheduledDate: new Date(job.scheduledDate),
        notes: job.notes,
      }));

      exportJobsToCSV(jobsWithClients);
      
      toast({
        title: "CSV Exported",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate job data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayJobs = jobs.filter(job => {
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === date.toDateString();
    });
    return {
      name: format(date, 'EEE'),
      jobs: dayJobs.length,
    };
  });

  // Calculate type distribution
  const typeCounts = jobs.reduce((acc: any, job) => {
    acc[job.type] = (acc[job.type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const COLORS = ['hsl(190 100% 50%)', 'hsl(280 100% 60%)', 'hsl(320 100% 50%)', 'hsl(40 100% 50%)'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Reports & Analytics</h1>
          <p className="text-muted-foreground">Weekly performance and job statistics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-border/50"
            onClick={handleExportCSV}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button 
            className="bg-primary text-black hover:bg-primary/90"
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Job Completion */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle>Weekly Jobs</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'cyan' }}
                />
                <Bar dataKey="jobs" fill="hsl(190 100% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Types Distribution */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle>Work Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
