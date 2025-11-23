import { useQuery } from "@tanstack/react-query";
import { jobsApi, statsApi } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MapPin,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getAll,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.getStats,
    initialData: { total: 0, pending: 0, inProgress: 0, completed: 0 }
  });

  if (jobsLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome back, <span className="text-primary">{user?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground">Here's your fiber network overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/jobs/new">
            <Button className="bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Plus className="mr-2 h-4 w-4" /> New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All assigned jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Active Assignments</h2>
            <Link href="/jobs">
              <Button variant="link" className="text-primary">View All</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {jobs.slice(0, 3).map((job) => (
              <Card key={job.id} className="bg-card/30 hover:bg-card/50 transition-colors border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">{job.clientName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          job.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          job.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-green-500/10 text-green-500 border-green-500/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground">Job Type</p>
                        <p className="text-sm font-medium text-primary">{job.type}</p>
                      </div>
                      <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Side Panel - System Status */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold font-display">System Status</h2>
           
           <Card className="bg-gradient-to-b from-card/80 to-card/40 border-border/50">
             <CardHeader>
               <CardTitle className="text-lg">Signal Quality</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Link Stability</span>
                   <span className="text-green-500 font-mono">98.4%</span>
                 </div>
                 <Progress value={98} className="h-2 bg-white/5" indicatorClassName="bg-green-500" />
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Signal Strength (avg)</span>
                   <span className="text-primary font-mono">-18.2 dBm</span>
                 </div>
                 <div className="h-24 w-full flex items-end gap-1 mt-2">
                   {[40, 60, 45, 70, 65, 50, 80, 75, 60, 55].map((h, i) => (
                     <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }} />
                   ))}
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-b from-card/80 to-card/40 border-border/50">
             <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Low Stock Alert</p>
                    <p className="text-sm text-muted-foreground">SC/APC Connectors below threshold.</p>
                  </div>
                </div>
                <Link href="/inventory">
                  <Button variant="secondary" className="w-full mt-4 h-8 text-xs">
                    View Inventory
                  </Button>
                </Link>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
