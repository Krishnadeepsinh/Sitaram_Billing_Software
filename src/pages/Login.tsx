import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        localStorage.setItem("isAuthenticated", "true");
        toast.success(`Welcome back, ${String(data.displayName || "Administrator")}`);
        navigate("/");
        window.location.reload();
      } else {
        toast.error(String(data.error || "Invalid credentials. Access denied."));
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Could not verify login from database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background radial hints */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(24_92%_50%/0.06),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(222_30%_16%/0.08),transparent_50%)]" />

      <div className="relative w-full max-w-sm">
        <div className="app-card p-8 space-y-6">
          {/* Logo + Brand */}
          <div className="text-center space-y-2">
            <Logo size="xl" showText={false} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">SITARAM</h1>
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
              Cable & Broadband
            </p>
            <p className="text-sm text-muted-foreground pt-1">
              Connecting every home through one billing workspace
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-11 bg-input border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 bg-input border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Sitaram Cable & Broadband · Chitra, Bhavnagar
        </p>
      </div>
    </div>
  );
}
