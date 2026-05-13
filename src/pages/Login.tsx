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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[420px] p-6 relative z-10 animate-fade-in">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <Logo size="xl" showText={false} className="mb-5" />
            <h1 className="text-3xl font-black text-white tracking-tight">SITARAM</h1>
            <p className="text-orange-400 text-sm mt-2 font-bold uppercase tracking-[0.18em]">Cable & Broadband</p>
            <p className="text-slate-400 text-sm mt-3">Connecting every home through one secure billing workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 pl-12 bg-slate-800/50 border-slate-700 text-white rounded-2xl focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 bg-slate-800/50 border-slate-700 text-white rounded-2xl focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 mt-6 bg-gradient-to-r from-primary to-emerald-600 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 text-center border-t border-slate-800 pt-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">
              Secure Terminal 0.4.2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
