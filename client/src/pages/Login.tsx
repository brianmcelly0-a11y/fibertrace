import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Lock, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import bgImage from "@assets/generated_images/dark_fiber_optic_background_with_neon_blue_light_trails.png";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("alex.tech@fibertrace.com");
  const [password, setPassword] = useState("password");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-60"
        style={{ 
          backgroundImage: `url(${bgImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-20 w-full max-w-md p-6">
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl neon-box animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 rounded-full bg-primary/20 items-center justify-center mb-4 neon-box">
              <Wifi className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">FiberTrace</h1>
            <p className="text-muted-foreground">Technician Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Technician ID / Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="tech-id@fibertrace.net" 
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-transparent text-primary focus:ring-offset-0" />
                Keep me logged in
              </label>
              <a href="#" className="text-primary hover:text-primary/80">Forgot password?</a>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all"
              disabled={loading}
            >
              {loading ? "Authenticating..." : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>v2.0.4 • Secure Connection • Offline Capable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
