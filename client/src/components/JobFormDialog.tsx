import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { jobsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import {
  calculateOperationalMetrics,
  formatMetricsForDisplay,
} from "@/lib/jobOperationalManager";
import { Zap } from "lucide-react";

const jobFormSchema = z.object({
  type: z.string().min(1, "Job type is required"),
  address: z.string().min(1, "Address is required"),
  materialsUsed: z.string().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNodeIds?: number[];
  routeDistance?: number;
  onSuccess?: () => void;
}

export function JobFormDialog({
  open,
  onOpenChange,
  selectedNodeIds = [],
  routeDistance = 0,
  onSuccess,
}: JobFormDialogProps) {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(true);

  const metrics = calculateOperationalMetrics(routeDistance, selectedNodeIds.length);
  const formatted = formatMetricsForDisplay(metrics);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      type: "Installation",
      address: "",
      materialsUsed: "",
      notes: "",
      scheduledDate: new Date().toISOString().split("T")[0],
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const jobData = {
        ...data,
        clientId: 1,
        technicianId: 1,
        cableUsed: metrics.estimatedCable.toString(),
        scheduledDate: new Date(data.scheduledDate),
      };
      return jobsApi.create(jobData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Success",
        description: "Job created with operational parameters",
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    createJobMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Job with Route Optimization</DialogTitle>
          <DialogDescription>
            Auto-calculated estimates based on selected nodes and route distance
          </DialogDescription>
        </DialogHeader>

        {/* Route Summary */}
        {showSummary && (
          <Card className="bg-primary/10 border-primary/30 p-4 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Route Summary
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Hide
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-bold text-primary">{formatted.distance}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Est. Cable</p>
                  <p className="text-sm font-bold text-primary">{formatted.cable}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="text-sm font-bold text-primary">{formatted.time}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Nodes</p>
                  <p className="text-sm font-bold text-primary">{metrics.nodeCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                <span className="text-xs text-muted-foreground">Power Impact</span>
                <Badge variant="outline" className="text-primary">
                  {formatted.impact}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Job Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Installation">Installation</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter job address"
                      {...field}
                      className="bg-card/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Date */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-card/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Materials */}
            <FormField
              control={form.control}
              name="materialsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materials Used</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SM fiber, SC connectors"
                      {...field}
                      className="bg-card/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add job notes..."
                      {...field}
                      className="bg-card/50 resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createJobMutation.isPending}
                className="bg-primary text-black hover:bg-primary/90"
              >
                {createJobMutation.isPending ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
