import React from 'react';
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/useAuth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Briefcase, 
  Map as MapIcon, 
  Activity, 
  Package, 
  FileBarChart, 
  LogOut, 
  Menu,
  Wifi
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const { user, logout } = useAuth();

  React.useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Jobs', icon: Briefcase, path: '/jobs' },
    { label: 'Map', icon: MapIcon, path: '/map' },
    { label: 'Meter', icon: Activity, path: '/meter' },
    { label: 'Inventory', icon: Package, path: '/inventory' },
    { label: 'Reports', icon: FileBarChart, path: '/reports' },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/50">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center neon-box">
          <Wifi className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-wider text-white">FiberTrace</h1>
          <p className="text-xs text-muted-foreground">Tech Portal v2.0</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary neon-border" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]")} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(6,182,212,1)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">ID: {user.id}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Wifi className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg">FiberTrace</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-border/50 bg-background">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
