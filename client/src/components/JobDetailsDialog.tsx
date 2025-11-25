import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { jobsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Edit2, Save, X } from "lucide-react";

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
}

export function JobDetailsDialog({
  open,
  onOpenChange,
  job,
}: JobDetailsDialogProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(job?.notes || "");

  const statusColorMap = {
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/30",
    Completed: "bg-green-500/10 text-green-500 border-green-500/30",
  };
  
  const statusColor = (job?.status && job.status in statusColorMap)
    ? statusColorMap[job.status as keyof typeof statusColorMap]
    : "bg-gray-500/10 text-gray-500 border-gray-500/30";

  const updateJobMutation = useMutation({
    mutationFn: (data: any) => jobsApi.update(job.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateJobMutation.mutate({ status: newStatus });
  };

  const handleSaveNotes = () => {
    updateJobMutation.mutate({ notes: editedNotes });
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-white">{job.type}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{job.address}</p>
            </div>
            <Badge variant="outline" className={statusColor}>
              {job.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job Information */}
          <Card className="bg-card/40 border-border/50 p-4">
            <h3 className="font-semibold text-white mb-3">Job Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Date:</span>
                <span className="text-foreground">
                  {format(new Date(job.scheduledDate), "MMM dd, yyyy")}
                </span>
              </div>
              {job.completedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Date:</span>
                  <span className="text-foreground">
                    {format(new Date(job.completedDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {job.cableUsed && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cable Used:</span>
                  <span className="text-foreground">{job.cableUsed} m</span>
                </div>
              )}
              {job.materialsUsed && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materials:</span>
                  <span className="text-foreground">{job.materialsUsed}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card className="bg-card/40 border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Notes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="bg-background/50 resize-none"
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updateJobMutation.isPending}
                  className="bg-primary text-black hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </div>
            ) : (
              <p className="text-sm text-foreground">
                {job.notes || "No notes added"}
              </p>
            )}
          </Card>

          {/* Status Management */}
          <Card className="bg-card/40 border-border/50 p-4">
            <h3 className="font-semibold text-white mb-3">Update Status</h3>
            <div className="flex gap-2 flex-wrap">
              {["Pending", "In Progress", "Completed"].map((status) => (
                <Button
                  key={status}
                  variant={job.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={updateJobMutation.isPending}
                  className={
                    job.status === status
                      ? "bg-primary text-black hover:bg-primary/90"
                      : ""
                  }
                >
                  {status === "In Progress" ? "Start" : status}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Close Button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
