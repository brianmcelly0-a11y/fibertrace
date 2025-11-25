import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers, Navigation, Play, Pause, Save, AlertCircle, Activity, Zap, X, Edit, Link2, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, gpsRoutesApi, authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getPowerStatus } from "@/lib/powerUtils";
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Olt, Splitter, Fat, Atb, Closure } from "@shared/schema";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type GPSPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

// Node creation form schema
const nodeCreationSchema = z.object({
  name: z.string().min(1, "Node name is required"),
  type: z.enum(['OLT', 'Splitter', 'FAT', 'ATB', 'Dome', 'Underground', 'Aerial']),
  location: z.string().min(1, "Location is required"),
  inputPower: z.string().optional(),
  notes: z.string().optional(),
});

type NodeCreationFormData = z.infer<typeof nodeCreationSchema>;

// Component to handle map centering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

// Component to handle map events for long-press node creation
function MapEventHandler({ onLongPress }: { onLongPress: (lat: number, lng: number) => void }) {
  const pressStartRef = useRef<number>(0);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onLongPress(e.latlng.lat, e.latlng.lng);
    },
    mousedown: (e) => {
      pressStartRef.current = Date.now();
      pressTimeoutRef.current = setTimeout(() => {
        if (Date.now() - pressStartRef.current >= 500) {
          onLongPress(e.latlng.lat, e.latlng.lng);
        }
      }, 500);
    },
    mouseup: () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    },
    mousemove: () => {
      if (pressTimeoutRef.current && Date.now() - pressStartRef.current >= 100) {
        clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
    },
  });

  return null;
}

// Create custom icons for different node types
const createNodeIcon = (type: string, powerColor?: string) => {
  const colorMap: Record<string, string> = {
    'OLT': '#10b981',
    'Splitter': '#3b82f6',
    'FAT': '#f59e0b',
    'ATB': '#8b5cf6',
    'Dome': '#ec4899',
    'Underground': '#6366f1',
    'Aerial': '#14b8a6'
  };
  
  const color = powerColor || colorMap[type];
  const letter = type === 'Dome' || type === 'Underground' || type === 'Aerial' ? 'C' : type.charAt(0);
  
  return L.divIcon({
    className: 'custom-node-icon',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">
        ${letter}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function Map() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [gpsPath, setGpsPath] = useState<[number, number][]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<GPSPermissionState>('prompt');
  const watchIdRef = useRef<number | null>(null);
  
  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    olts: true,
    splitters: true,
    fats: true,
    atbs: true,
    closures: true,
    gpsPath: true,
    jobRoutes: true,
    currentLocation: true,
  });

  const toggleLayer = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Selected node state for details panel
  const [selectedNode, setSelectedNode] = useState<{
    type: 'OLT' | 'Splitter' | 'FAT' | 'ATB' | 'Closure';
    data: any;
  } | null>(null);

  // Node creation dialog state
  const [nodeCreationOpen, setNodeCreationOpen] = useState(false);
  const [nodeCreationLat, setNodeCreationLat] = useState<number | null>(null);
  const [nodeCreationLng, setNodeCreationLng] = useState<number | null>(null);

  // Node creation form
  const form = useForm<NodeCreationFormData>({
    resolver: zodResolver(nodeCreationSchema),
    defaultValues: {
      name: '',
      type: 'Splitter',
      location: '',
      inputPower: '',
      notes: '',
    },
  });

  const handleLongPress = (lat: number, lng: number) => {
    setNodeCreationLat(lat);
    setNodeCreationLng(lng);
    setNodeCreationOpen(true);
  };

  const onNodeCreationSubmit = (data: NodeCreationFormData) => {
    console.log('Node creation submitted:', { ...data, lat: nodeCreationLat, lng: nodeCreationLng });
    toast({
      title: "Node Created",
      description: `Created ${data.type} node: ${data.name}`,
    });
    setNodeCreationOpen(false);
    form.reset();
  };

  // Fiber route drawing state
  const [routeDrawingMode, setRouteDrawingMode] = useState(false);
  const [routeStartNode, setRouteStartNode] = useState<{
    type: string;
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [routeEndNode, setRouteEndNode] = useState<{
    type: string;
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  const handleStartRoute = () => {
    if (selectedNode) {
      const lat = parseFloat(selectedNode.data.latitude);
      const lng = parseFloat(selectedNode.data.longitude);
      setRouteStartNode({
        type: selectedNode.type,
        lat,
        lng,
        name: selectedNode.data.name,
      });
      setRouteDrawingMode(true);
      setSelectedNode(null);
      toast({
        title: "Route Drawing Started",
        description: `Selected ${selectedNode.data.name} as start node. Click another node to complete the route.`,
      });
    }
  };

  const handleCompleteRoute = () => {
    if (selectedNode && routeStartNode) {
      const lat = parseFloat(selectedNode.data.latitude);
      const lng = parseFloat(selectedNode.data.longitude);
      const distanceMeters = calculateDistance([routeStartNode.lat, routeStartNode.lng], [lat, lng]);
      const distanceKm = distanceMeters / 1000; // Convert to km
      const cableRequired = distanceKm * 1.1; // 10% slack
      
      setRouteEndNode({
        type: selectedNode.type,
        lat,
        lng,
        name: selectedNode.data.name,
      });
      setCalculatedDistance(distanceKm);
      setRouteDrawingMode(false);
      
      toast({
        title: "Route Created",
        description: `Route: ${routeStartNode.name} → ${selectedNode.data.name}. Distance: ${distanceKm.toFixed(2)} km, Cable needed: ${cableRequired.toFixed(2)} km`,
      });
      setSelectedNode(null);
    }
  };

  // Fetch map data without authentication
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getAll,
  });

  const { data: olts = [], isLoading: oltsLoading, error: oltsError } = useQuery<Olt[]>({
    queryKey: ['/api/olts'],
  });

  const { data: splitters = [], isLoading: splittersLoading, error: splittersError } = useQuery<Splitter[]>({
    queryKey: ['/api/splitters'],
  });

  const { data: fats = [], isLoading: fatsLoading, error: fatsError } = useQuery<Fat[]>({
    queryKey: ['/api/fats'],
  });

  const { data: atbs = [], isLoading: atbsLoading, error: atbsError } = useQuery<Atb[]>({
    queryKey: ['/api/atbs'],
  });

  const { data: closures = [], isLoading: closuresLoading, error: closuresError } = useQuery<Closure[]>({
    queryKey: ['/api/closures'],
  });

  const saveGPSRouteMutation = useMutation({
    mutationFn: async (waypoints: [number, number][]) => {
      const linearDistance = calculateTotalDistance(waypoints);
      return gpsRoutesApi.create({
        name: `GPS Track ${new Date().toISOString()}`,
        waypoints: JSON.stringify(waypoints),
        linearDistance: linearDistance.toFixed(2),
        routedDistance: linearDistance.toFixed(2),
        cableRequired: (linearDistance * 1.1).toFixed(2), // 10% slack
        slackPercentage: 10,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fiber-routes'] });
      toast({
        title: "GPS Route Saved",
        description: "Your tracked path has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save GPS route",
        variant: "destructive",
      });
    },
  });

  // Calculate the best initial center point
  const getInitialCenter = (): [number, number] => {
    // Priority 1: Current GPS location
    if (currentLocation) return currentLocation;
    
    // Priority 2: First job with coordinates
    const jobWithCoords = jobs.find(j => j.latitude && j.longitude);
    if (jobWithCoords) {
      return [parseFloat(jobWithCoords.latitude!), parseFloat(jobWithCoords.longitude!)];
    }
    
    // Priority 3: First OLT with coordinates
    const oltWithCoords = olts.find(o => o.latitude && o.longitude);
    if (oltWithCoords) {
      return [parseFloat(oltWithCoords.latitude!), parseFloat(oltWithCoords.longitude!)];
    }
    
    // Priority 4: Any node with coordinates
    const nodeWithCoords = [...splitters, ...fats, ...atbs, ...closures].find(n => n.latitude && n.longitude);
    if (nodeWithCoords) {
      return [parseFloat(nodeWithCoords.latitude!), parseFloat(nodeWithCoords.longitude!)];
    }
    
    // Fallback: Default location (New York)
    return [40.7128, -74.0060];
  };

  const center = getInitialCenter();

  // Check GPS permission
  const checkGPSPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      return false;
    }

    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionState(result.state as GPSPermissionState);
        return result.state === 'granted';
      }
      return true; // Assume available if permissions API not supported
    } catch (error) {
      console.error("Error checking GPS permission:", error);
      return true;
    }
  };

  // Start GPS tracking
  const startTracking = async () => {
    const hasPermission = await checkGPSPermission();
    
    if (!navigator.geolocation) {
      toast({
        title: "GPS Unavailable",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setCurrentLocation(newLocation);
        setGpsPath([newLocation]);
        setAccuracy(position.coords.accuracy);
        setPermissionState('granted');
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsTracking(false);
        
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          toast({
            title: "Permission Denied",
            description: "Please allow location access in your browser settings to use GPS tracking.",
            variant: "destructive",
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast({
            title: "Location Unavailable",
            description: "Unable to determine your location. Please check your GPS settings.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "GPS Error",
            description: "Failed to get your location. Please try again.",
            variant: "destructive",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Watch position for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setCurrentLocation(newLocation);
        setGpsPath(prev => [...prev, newLocation]);
        setAccuracy(position.coords.accuracy);
      },
      (error) => {
        console.error("Error watching location:", error);
        // Don't stop tracking on intermittent errors, just log them
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Save GPS route
  const saveGPSRoute = () => {
    if (gpsPath.length < 2) {
      toast({
        title: "Insufficient Data",
        description: "Track a longer path before saving (minimum 2 points).",
        variant: "destructive",
      });
      return;
    }
    
    saveGPSRouteMutation.mutate(gpsPath);
  };

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
    const deltaLon = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Calculate total distance of path
  const calculateTotalDistance = (path: [number, number][]): number => {
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      total += calculateDistance(path[i - 1], path[i]);
    }
    return total;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);


  // Check for any loading states
  const isLoading = jobsLoading || oltsLoading || splittersLoading || fatsLoading || atbsLoading || closuresLoading;
  const hasErrors = jobsError || oltsError || splittersError || fatsError || atbsError || closuresError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Map Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {jobsError?.message || oltsError?.message || splittersError?.message || 
               fatsError?.message || atbsError?.message || closuresError?.message || 
               "Failed to load map data"}
            </p>
            <Button onClick={() => queryClient.invalidateQueries()} data-testid="button-retry">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex gap-0">
      {/* Sidebar with toggles */}
      <div className="w-80 bg-card border-r border-border/50 shadow-lg flex flex-col overflow-hidden">
        <div className="overflow-y-auto flex-1">
          {/* GPS Tracking Section */}
          <div className="p-3 border-b border-border/50">
            <Card className="bg-card/90 backdrop-blur-md border-border/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-1">
                  <Navigation className="h-4 w-4 text-primary" />
                  GPS Tracking
                </h3>
                <div className="flex gap-1">
                  {isTracking && gpsPath.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveGPSRoute}
                      disabled={saveGPSRouteMutation.isPending}
                      data-testid="button-save-route"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isTracking ? "destructive" : "default"}
                    onClick={isTracking ? stopTracking : startTracking}
                    disabled={permissionState === 'denied' || permissionState === 'unavailable'}
                    data-testid="button-gps-toggle"
                  >
                    {isTracking ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {permissionState === 'denied' && (
                <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Location permission denied
                  </p>
                </div>
              )}
              {permissionState === 'unavailable' && (
                <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    GPS not available
                  </p>
                </div>
              )}
              {currentLocation ? (
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    <strong>Lat:</strong> {currentLocation[0].toFixed(6)}°
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Lon:</strong> {currentLocation[1].toFixed(6)}°
                  </p>
                  {accuracy && (
                    <p className="text-muted-foreground">
                      <strong>Accuracy:</strong> ±{accuracy.toFixed(0)}m
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <strong>Path Points:</strong> {gpsPath.length}
                  </p>
                  {gpsPath.length > 1 && (
                    <p className="text-muted-foreground">
                      <strong>Distance:</strong> {(calculateTotalDistance(gpsPath)).toFixed(0)}m
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Click Start to track location</p>
              )}
            </Card>
          </div>

          {/* Map Layers Section */}
          <div className="p-3">
            <Card className="bg-card/90 backdrop-blur-md border-border/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-1">
                  <Layers className="h-4 w-4 text-primary" />
                  Map Layers
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full border border-white"></div>
                    <span>OLTs ({olts.length})</span>
                  </div>
                  <Switch
                    checked={layerVisibility.olts}
                    onCheckedChange={() => toggleLayer('olts')}
                    data-testid="toggle-olts"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-blue-500 rounded-full border border-white"></div>
                    <span>Splitters ({splitters.length})</span>
                  </div>
                  <Switch
                    checked={layerVisibility.splitters}
                    onCheckedChange={() => toggleLayer('splitters')}
                    data-testid="toggle-splitters"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-amber-500 rounded-full border border-white"></div>
                    <span>FATs ({fats.length})</span>
                  </div>
                  <Switch
                    checked={layerVisibility.fats}
                    onCheckedChange={() => toggleLayer('fats')}
                    data-testid="toggle-fats"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-purple-500 rounded-full border border-white"></div>
                    <span>ATBs ({atbs.length})</span>
                  </div>
                  <Switch
                    checked={layerVisibility.atbs}
                    onCheckedChange={() => toggleLayer('atbs')}
                    data-testid="toggle-atbs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-pink-500 rounded-full border border-white"></div>
                    <span>Closures ({closures.length})</span>
                  </div>
                  <Switch
                    checked={layerVisibility.closures}
                    onCheckedChange={() => toggleLayer('closures')}
                    data-testid="toggle-closures"
                  />
                </div>
                <div className="border-t border-border/50 my-2"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-cyan-500 rounded-md border border-white"></div>
                    <span>Job Routes</span>
                  </div>
                  <Switch
                    checked={layerVisibility.jobRoutes}
                    onCheckedChange={() => toggleLayer('jobRoutes')}
                    data-testid="toggle-job-routes"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-400 rounded-md border border-white"></div>
                    <span>GPS Path</span>
                  </div>
                  <Switch
                    checked={layerVisibility.gpsPath}
                    onCheckedChange={() => toggleLayer('gpsPath')}
                    data-testid="toggle-gps-path"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
                    <span>Current Location</span>
                  </div>
                  <Switch
                    checked={layerVisibility.currentLocation}
                    onCheckedChange={() => toggleLayer('currentLocation')}
                    data-testid="toggle-current-location"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={center} 
          zoom={14} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          className="z-0"
        >
        <MapController center={center} />
        <MapEventHandler onLongPress={handleLongPress} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* GPS Path */}
        {layerVisibility.gpsPath && gpsPath.length > 1 && (
          <Polyline 
            positions={gpsPath} 
            color="#10b981" 
            weight={3} 
            opacity={0.8} 
            data-testid="gps-path"
          />
        )}

        {/* Job Routes */}
        {layerVisibility.jobRoutes && jobs.length > 0 && (
          <Polyline 
            positions={jobs
              .filter(job => job.latitude && job.longitude)
              .map(job => [parseFloat(job.latitude!), parseFloat(job.longitude!)])} 
            color="cyan" 
            weight={2} 
            opacity={0.5} 
            dashArray="5, 10" 
          />
        )}

        {/* Fiber Route Being Drawn */}
        {routeDrawingMode && routeStartNode && routeEndNode && (
          <Polyline 
            positions={[[routeStartNode.lat, routeStartNode.lng], [routeEndNode.lat, routeEndNode.lng]]} 
            color="#06b6d4" 
            weight={3} 
            opacity={0.9}
            data-testid="route-line"
          />
        )}

        {/* Completed Fiber Route */}
        {calculatedDistance && routeStartNode && routeEndNode && !routeDrawingMode && (
          <Polyline 
            positions={[[routeStartNode.lat, routeStartNode.lng], [routeEndNode.lat, routeEndNode.lng]]} 
            color="#06b6d4" 
            weight={3} 
            opacity={0.7}
            dashArray="10, 5"
            data-testid="completed-route"
          />
        )}

        {/* Current Location Marker */}
        {layerVisibility.currentLocation && currentLocation && (
          <Marker 
            position={currentLocation} 
            icon={L.divIcon({
              className: 'bg-transparent',
              html: '<div class="h-5 w-5 bg-green-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)] border-3 border-white animate-pulse"></div>'
            })}
            data-testid="marker-current-location"
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">Your Location</h3>
                <p className="text-xs">Lat: {currentLocation[0].toFixed(6)}</p>
                <p className="text-xs">Lon: {currentLocation[1].toFixed(6)}</p>
                {accuracy && <p className="text-xs">Accuracy: ±{accuracy.toFixed(0)}m</p>}
              </div>
            </Popup>
          </Marker>
        )}

        {/* OLT Markers */}
        {layerVisibility.olts && olts.map((olt) => {
          if (!olt.latitude || !olt.longitude) return null;
          return (
            <Marker 
              key={`olt-${olt.id}`}
              position={[parseFloat(olt.latitude), parseFloat(olt.longitude)]}
              icon={createNodeIcon('OLT')}
              data-testid={`marker-olt-${olt.id}`}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'OLT', data: olt })
              }}
            />
          );
        })}

        {/* Splitter Markers */}
        {layerVisibility.splitters && splitters.map((splitter) => {
          if (!splitter.latitude || !splitter.longitude) return null;
          const powerInfo = getPowerStatus(splitter.inputPower);
          
          return (
            <Marker 
              key={`splitter-${splitter.id}`}
              position={[parseFloat(splitter.latitude), parseFloat(splitter.longitude)]}
              icon={createNodeIcon('Splitter', powerInfo.color)}
              data-testid={`marker-splitter-${splitter.id}`}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'Splitter', data: splitter })
              }}
            />
          );
        })}

        {/* FAT Markers */}
        {layerVisibility.fats && fats.map((fat) => {
          if (!fat.latitude || !fat.longitude) return null;
          const powerInfo = getPowerStatus(fat.inputPower);
          
          return (
            <Marker 
              key={`fat-${fat.id}`}
              position={[parseFloat(fat.latitude), parseFloat(fat.longitude)]}
              icon={createNodeIcon('FAT', powerInfo.color)}
              data-testid={`marker-fat-${fat.id}`}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'FAT', data: fat })
              }}
            />
          );
        })}

        {/* ATB Markers */}
        {layerVisibility.atbs && atbs.map((atb) => {
          if (!atb.latitude || !atb.longitude) return null;
          const powerInfo = getPowerStatus(atb.inputPower);
          
          return (
            <Marker 
              key={`atb-${atb.id}`}
              position={[parseFloat(atb.latitude), parseFloat(atb.longitude)]}
              icon={createNodeIcon('ATB', powerInfo.color)}
              data-testid={`marker-atb-${atb.id}`}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'ATB', data: atb })
              }}
            />
          );
        })}

        {/* Closure Markers */}
        {layerVisibility.closures && closures.map((closure) => {
          if (!closure.latitude || !closure.longitude) return null;
          const powerInfo = getPowerStatus(closure.inputPower);
          
          return (
            <Marker 
              key={`closure-${closure.id}`}
              position={[parseFloat(closure.latitude), parseFloat(closure.longitude)]}
              icon={createNodeIcon(closure.type, powerInfo.color)}
              data-testid={`marker-closure-${closure.id}`}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'Closure', data: closure })
              }}
            />
          );
        })}
      </MapContainer>

        {/* Add Node Button */}
        <div className="absolute bottom-8 right-4 z-[400] flex flex-col gap-2">
        <Button 
          size="icon" 
          className="rounded-full bg-primary text-black"
          data-testid="button-add-node"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-8 left-4 z-[400] max-w-sm">
          <Card className="bg-card/95 backdrop-blur-md border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{
                  backgroundColor: selectedNode.type === 'OLT' ? '#3b82f6' :
                                  selectedNode.type === 'Splitter' ? '#10b981' :
                                  selectedNode.type === 'FAT' ? '#f59e0b' :
                                  selectedNode.type === 'ATB' ? '#8b5cf6' :
                                  '#ec4899'
                }} />
                {selectedNode.data.name}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                data-testid="button-close-details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Badge className="text-xs mb-3">{selectedNode.type}</Badge>

            <div className="space-y-2 mb-4 text-xs">
              <p><strong>Location:</strong> {selectedNode.data.location}</p>
              
              {selectedNode.type === 'OLT' && (
                <>
                  <p><strong>Capacity:</strong> {selectedNode.data.capacity} ports</p>
                  <p><strong>Used:</strong> {selectedNode.data.usedPorts}/{selectedNode.data.capacity}</p>
                  {selectedNode.data.vendor && <p><strong>Vendor:</strong> {selectedNode.data.vendor}</p>}
                </>
              )}

              {(selectedNode.type === 'Splitter' || selectedNode.type === 'FAT' || selectedNode.type === 'ATB') && (
                <>
                  {selectedNode.type !== 'Splitter' && <p><strong>Ports:</strong> {selectedNode.data.usedPorts}/{selectedNode.data.totalPorts}</p>}
                  {selectedNode.type === 'Splitter' && <p><strong>Ratio:</strong> {selectedNode.data.splitRatio}</p>}
                  {selectedNode.data.inputPower && (
                    <p className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <strong>Power:</strong> {selectedNode.data.inputPower} dBm
                    </p>
                  )}
                </>
              )}

              {selectedNode.type === 'Closure' && (
                <>
                  <p><strong>Type:</strong> {selectedNode.data.type}</p>
                  <p><strong>Fibers:</strong> {selectedNode.data.fiberCount}</p>
                  <p><strong>Splices:</strong> {selectedNode.data.spliceCount}</p>
                  {selectedNode.data.inputPower && (
                    <p className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <strong>Power:</strong> {selectedNode.data.inputPower} dBm
                    </p>
                  )}
                </>
              )}

              <p><strong>Status:</strong> <Badge variant={selectedNode.data.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{selectedNode.data.status}</Badge></p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!routeDrawingMode ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleStartRoute} data-testid="button-start-route">
                    <Plus className="h-3 w-3 mr-1" />
                    Start Route
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-edit-node">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="default" onClick={handleCompleteRoute} data-testid="button-complete-route">
                    <Plus className="h-3 w-3 mr-1" />
                    Complete Route
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setRouteDrawingMode(false);
                    setRouteStartNode(null);
                    setSelectedNode(null);
                  }} data-testid="button-cancel-route">
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {calculatedDistance && routeStartNode && routeEndNode && (
              <div className="mt-3 p-2 bg-primary/10 rounded text-xs">
                <p className="font-bold mb-1">Route Info:</p>
                <p>{routeStartNode.name} → {routeEndNode.name}</p>
                <p>Distance: {calculatedDistance.toFixed(2)} km</p>
                <p>Cable Required (10% slack): {(calculatedDistance * 1.1).toFixed(2)} km</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>

      {/* Node Creation Dialog */}
      <Dialog open={nodeCreationOpen} onOpenChange={setNodeCreationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Node</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onNodeCreationSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., OLT-Main-01" {...field} data-testid="input-node-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-node-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OLT">OLT</SelectItem>
                        <SelectItem value="Splitter">Splitter</SelectItem>
                        <SelectItem value="FAT">FAT</SelectItem>
                        <SelectItem value="ATB">ATB</SelectItem>
                        <SelectItem value="Dome">Dome Closure</SelectItem>
                        <SelectItem value="Underground">Underground Closure</SelectItem>
                        <SelectItem value="Aerial">Aerial Closure</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Downtown Central Office" {...field} data-testid="input-node-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inputPower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input Power (dBm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., -5.2" {...field} data-testid="input-node-power" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes about this node..." {...field} data-testid="input-node-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setNodeCreationOpen(false)} data-testid="button-cancel-node">
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-create-node">
                  Create Node
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
