import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
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
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Loading page...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Checking secure session...</p>
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

