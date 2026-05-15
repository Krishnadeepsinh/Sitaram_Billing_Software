import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Error 404</p>
      <h1 className="font-display mt-3 text-5xl font-semibold tracking-tight text-slate-800">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-400">
        The link may be broken or the page may have been removed.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
      >
        Back to dashboard
      </a>
    </div>
  );
};

export default NotFound;

