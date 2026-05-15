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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60" />

      <div className="w-full max-w-sm p-6 relative z-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center mb-10 text-center">
            <Logo size="xl" showText={false} className="mb-5" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1B2B4B]">SITARAM</h1>
            <p className="mt-1 text-sm font-semibold text-orange-500">Cable & Broadband</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Secure workspace for collections, invoices, and subscriber records.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-medium text-slate-500">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 pl-12 bg-slate-50 border-slate-200 text-slate-800 rounded-lg focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-xs font-medium text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-800 rounded-lg focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-400">Billing workspace v0.4.2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
