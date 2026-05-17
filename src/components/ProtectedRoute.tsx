import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        const response = await fetch("/api/session", { credentials: "include" });
        if (cancelled) return;

        if (response.ok) {
          localStorage.setItem("isAuthenticated", "true");
          setStatus("authenticated");
          return;
        }
      } catch (error) {
        console.error("Session check failed", error);
      }

      if (!cancelled) {
        localStorage.removeItem("isAuthenticated");
        setStatus("unauthenticated");
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-slate-200 shadow-lg">
          <div className="h-16 w-16 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-orange-500 animate-pulse" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-bold text-slate-800">Verifying Session</h2>
            <p className="text-xs text-slate-500">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
