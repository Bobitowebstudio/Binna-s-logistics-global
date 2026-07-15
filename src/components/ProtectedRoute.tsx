import React, { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  loading: boolean;
  onRedirect: () => void;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  isAuthenticated,
  userEmail,
  loading,
  onRedirect,
  children,
}: ProtectedRouteProps) {
  const isAuthorizedAdmin = isAuthenticated && userEmail === "info@binnaslogisticsglobal.com.ng";

  useEffect(() => {
    if (!loading && !isAuthorizedAdmin) {
      // Trigger redirect callback if authentication checks fail
      onRedirect();
    }
  }, [loading, isAuthorizedAdmin, onRedirect]);

  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center bg-slate-50 p-8 text-center" id="protected-route-loading">
        <Loader2 className="w-12 h-12 animate-spin text-[#0f4c81] mb-4" />
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Verifying Security Context...</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Restoring your secure administrator session keys and verifying token signatures.
        </p>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center bg-red-50 p-8 text-center" id="protected-route-denied">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4 border border-red-200 shadow-sm animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-red-900 tracking-tight">Access Strictly Denied</h3>
        <p className="text-xs text-red-700 max-w-sm mt-2 leading-relaxed">
          You are not authorized to access the Admin Panel. Access is limited to authorized system directors only. Redirecting you safely...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
