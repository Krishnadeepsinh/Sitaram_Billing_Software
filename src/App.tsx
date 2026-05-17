import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import AppLayout from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Subscribers = lazy(() => import("./pages/Subscribers"));
const Plans       = lazy(() => import("./pages/Plans"));
const Invoices    = lazy(() => import("./pages/Invoices"));
const Payments    = lazy(() => import("./pages/Payments"));
const Reports     = lazy(() => import("./pages/Reports"));
const Expenses    = lazy(() => import("./pages/Expenses"));
const Reminders   = lazy(() => import("./pages/Reminders"));
const Settings    = lazy(() => import("./pages/Settings"));
const Backup      = lazy(() => import("./pages/Backup"));

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { BillingProvider } from "./context/BillingContext";

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-12">
    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300">
      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      <p className="text-sm font-medium text-slate-500">Loading module...</p>
    </div>
  </div>
);

import { ProtectedRoute } from "./components/ProtectedRoute";

// Convenience helper so each page route gets its own boundary + suspense
const Page = ({ component: C }: { component: React.ComponentType }) => (
  <ErrorBoundary>
    <Suspense fallback={<RouteLoader />}>
      <C />
    </Suspense>
  </ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/*
      Outer ErrorBoundary — catches crashes from BillingProvider itself
      (e.g. DB connection failure on first render / missing env vars).
      Renders a "Database Connection Error" screen instead of white page.
    */}
    <ErrorBoundary>
      <BillingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/"            element={<Page component={Dashboard}   />} />
                <Route path="/subscribers" element={<Page component={Subscribers} />} />
                <Route path="/plans"       element={<Page component={Plans}       />} />
                <Route path="/invoices"    element={<Page component={Invoices}    />} />
                <Route path="/payments"    element={<Page component={Payments}    />} />
                <Route path="/reports"     element={<Page component={Reports}     />} />
                <Route path="/expenses"    element={<Page component={Expenses}    />} />
                <Route path="/reminders"   element={<Page component={Reminders}   />} />
                <Route path="/settings"    element={<Page component={Settings}    />} />
                <Route path="/backup"      element={<Page component={Backup}      />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BillingProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
