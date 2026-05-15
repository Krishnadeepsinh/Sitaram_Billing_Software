import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-muted-foreground/40">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page does not exist or has been moved.
        </p>
        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
