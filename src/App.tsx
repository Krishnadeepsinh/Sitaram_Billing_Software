import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, ShieldCheck, Activity } from "lucide-react";
import AppLayout from "./components/AppLayout";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Subscribers = lazy(() => import("./pages/Subscribers"));
const Plans = lazy(() => import("./pages/Plans"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Reminders = lazy(() => import("./pages/Reminders"));
const Settings = lazy(() => import("./pages/Settings"));
const Backup = lazy(() => import("./pages/Backup"));
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { BillingProvider } from "./context/BillingContext";

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-12">
    <div className="flex flex-col items-center gap-6 p-12 rounded-[3rem] bg-slate-900/20 border border-white/5 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
      <div className="relative h-20 w-20 rounded-3xl bg-slate-950 flex items-center justify-center shadow-inner border border-white/5">
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin relative z-10" />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-black tracking-[0.5em] text-blue-500 uppercase italic">Dispatching_Module</p>
        <p className="text-[9px] font-black tracking-[0.2em] text-slate-700 uppercase italic">Retrieving Encrypted Registry Data</p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Industrial background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
        
        <div className="flex flex-col items-center gap-8 p-16 rounded-[4rem] bg-slate-900/40 border border-white/5 backdrop-blur-[80px] shadow-2xl relative z-10">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="h-24 w-24 rounded-[2rem] bg-slate-950 border border-white/10 flex items-center justify-center shadow-inner relative z-10">
               <ShieldCheck className="h-12 w-12 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 text-center">
            <h2 className="text-xl font-black tracking-[0.3em] text-white uppercase italic">Security_Handshake</h2>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase italic flex items-center justify-center gap-2">
               <Activity className="h-3 w-3 text-blue-500" /> Verifying Terminal Authentication Status
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BillingProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>} />
              <Route path="/subscribers" element={<Suspense fallback={<RouteLoader />}><Subscribers /></Suspense>} />
              <Route path="/plans" element={<Suspense fallback={<RouteLoader />}><Plans /></Suspense>} />
              <Route path="/invoices" element={<Suspense fallback={<RouteLoader />}><Invoices /></Suspense>} />
              <Route path="/payments" element={<Suspense fallback={<RouteLoader />}><Payments /></Suspense>} />
              <Route path="/reports" element={<Suspense fallback={<RouteLoader />}><Reports /></Suspense>} />
              <Route path="/expenses" element={<Suspense fallback={<RouteLoader />}><Expenses /></Suspense>} />
              <Route path="/reminders" element={<Suspense fallback={<RouteLoader />}><Reminders /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<RouteLoader />}><Settings /></Suspense>} />
              <Route path="/backup" element={<Suspense fallback={<RouteLoader />}><Backup /></Suspense>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BillingProvider>
  </QueryClientProvider>
);

export default App;
