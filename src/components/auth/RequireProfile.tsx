import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface RequireProfileProps {
  children: React.ReactNode;
}

export const RequireProfile = ({ children }: RequireProfileProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Show loader while checking auth/profile
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but profile incomplete - redirect to setup
  if (profile && !profile.profile_complete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};
