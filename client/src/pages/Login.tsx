import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Lock, User, ArrowRight, UserPlus, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import bgImage from "@assets/generated_images/dark_fiber_optic_background_with_neon_blue_light_trails.png";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("alex.tech@fibertrace.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Registration Failed",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          phone: phone || undefined,
          role: "Technician",
        }),
      });

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Logging you in...",
      });

      // Auto-login after successful registration
      await login(email, password);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setLoading(false);
    // Reset form fields when switching modes
    if (!isRegisterMode) {
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
      setConfirmPassword("");
    } else {
      setEmail("alex.tech@fibertrace.com");
      setPassword("password");
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
              {isRegisterMode ? (
                <UserPlus className="h-8 w-8 text-primary" />
              ) : (
                <Wifi className="h-8 w-8 text-primary" />
              )}
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">FiberTrace</h1>
            <p className="text-muted-foreground">
              {isRegisterMode ? "Create New Technician Account" : "Technician Access Portal"}
            </p>
          </div>

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    type="text"
                    placeholder="John Smith" 
                    className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                    data-testid="input-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Technician ID / Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="tech-id@fibertrace.net" 
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                  data-testid="input-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel"
                    placeholder="+1 (555) 123-4567" 
                    className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                    data-testid="input-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-primary/50 h-12"
                    data-testid="input-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {!isRegisterMode && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 bg-transparent text-primary focus:ring-offset-0" />
                  Keep me logged in
                </label>
                <a href="#" className="text-primary hover:text-primary/80">Forgot password?</a>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all"
              data-testid={isRegisterMode ? "button-register" : "button-login"}
              disabled={loading}
            >
              {loading ? (isRegisterMode ? "Creating Account..." : "Authenticating...") : (
                <span className="flex items-center gap-2">
                  {isRegisterMode ? (
                    <>Create Account <UserPlus className="h-4 w-4" /></>
                  ) : (
                    <>Sign In <ArrowRight className="h-4 w-4" /></>
                  )}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-toggle-mode"
              disabled={loading}
            >
              {isRegisterMode ? (
                <>Already have an account? <span className="text-primary font-medium">Sign In</span></>
              ) : (
                <>Need an account? <span className="text-primary font-medium">Register Here</span></>
              )}
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>v2.0.4 • Secure Connection • Offline Capable</p>
            {!isRegisterMode && (
              <p className="mt-2 text-xs text-primary/60">
                Demo: alex.tech@fibertrace.com / password
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
