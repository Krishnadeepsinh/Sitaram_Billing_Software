import React from "react";
import { ShieldAlert, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || "Unknown error";
    const isDbError =
      msg.toLowerCase().includes("database") ||
      msg.toLowerCase().includes("turso") ||
      msg.toLowerCase().includes("sqlite") ||
      msg.toLowerCase().includes("network") ||
      msg.toLowerCase().includes("fetch") ||
      msg.toLowerCase().includes("401") ||
      msg.toLowerCase().includes("unauthorized");

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            padding: "40px 36px",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: isDbError ? "#fff7ed" : "#fef2f2",
              border: `1px solid ${isDbError ? "#fed7aa" : "#fecaca"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            {isDbError ? (
              <ShieldAlert size={36} color="#f97316" />
            ) : (
              <AlertTriangle size={36} color="#ef4444" />
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
            {isDbError ? "Database Connection Error" : "Something Went Wrong"}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
            {isDbError
              ? "The app could not connect to the database. This usually means environment variables are missing or incorrect in the Vercel deployment."
              : "An unexpected error occurred while rendering the app."}
          </p>

          {/* Error detail box */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 28,
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
              Error Details
            </p>
            <code style={{ fontSize: 13, color: "#dc2626", wordBreak: "break-word", lineHeight: 1.5 }}>
              {msg}
            </code>
          </div>

          {/* DB-specific help */}
          {isDbError && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 28,
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", margin: "0 0 8px" }}>
                Required Vercel Environment Variables
              </p>
              {[
                "BROADBAND_TURSO_DATABASE_URL",
                "BROADBAND_TURSO_AUTH_TOKEN",
                "CABLE_TURSO_DATABASE_URL",
                "CABLE_TURSO_AUTH_TOKEN",
                "ADMIN_USERNAME",
                "ADMIN_PASSWORD",
                "SESSION_SECRET",
              ].map((v) => (
                <div key={v} style={{ fontFamily: "monospace", fontSize: 12, color: "#ea580c", padding: "2px 0" }}>
                  • {v}
                </div>
              ))}
              <p style={{ fontSize: 11, color: "#92400e", margin: "10px 0 0" }}>
                Go to Vercel → Project → Settings → Environment Variables to verify these are set.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              Reload App
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
