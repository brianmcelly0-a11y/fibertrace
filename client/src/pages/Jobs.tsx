import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  MoreVertical,
  Navigation
} from "lucide-react";
import { format } from "date-fns";

export default function Jobs() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getAll,
  });

  if (isLoading) {
    return <div className="text-white">Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Job Management</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." className="pl-9 bg-card/50 border-border/50" />
          </div>
          <Button variant="outline" size="icon" className="border-border/50">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="bg-card/40 border-border/50 hover:border-primary/30 transition-all group">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Status Indicator & Date */}
                <div className="flex md:flex-col items-center md:items-start justify-between gap-2 md:w-32 md:border-r md:border-border/30 md:pr-6">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(new Date(job.scheduledDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">09:00 AM</p>
                  </div>
                  <Badge variant="outline" className={`
                    ${job.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 
                      job.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/30'}
                  `}>
                    {job.status}
                  </Badge>
                </div>

                {/* Middle: Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {job.clientName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {job.address}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-muted-foreground">
                      {job.type}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-muted-foreground">
                      ID: #{job.id}
                    </Badge>
                    {job.notes && (
                      <span className="text-xs text-muted-foreground flex items-center mt-1 ml-2">
                        "{job.notes}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col gap-2 md:w-32 md:pl-6 md:border-l md:border-border/30 justify-end">
                  <Button className="w-full bg-primary text-black hover:bg-primary/90">
                    Resume
                  </Button>
                  <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                    <Navigation className="mr-2 h-3 w-3" />
                    Route
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No jobs assigned yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
