import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireProfile } from "@/components/auth/RequireProfile";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import ProfileSetup from "@/pages/ProfileSetup";
import Destinations from "@/pages/Destinations";
import CityDetail from "@/pages/CityDetail";
import Trips from "@/pages/Trips";
import TripDetail from "@/pages/TripDetail";
import NewTrip from "@/pages/NewTrip";
import Nearby from "@/pages/Nearby";
import Profile from "@/pages/Profile";
import ResetPassword from "@/pages/ResetPassword";
import PublicTripView from "@/pages/PublicTripView";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route element={<Layout />}>
              <Route path="/" element={<RequireProfile><Home /></RequireProfile>} />
              <Route path="/destinations" element={<RequireProfile><Destinations /></RequireProfile>} />
              <Route path="/city/:cityId" element={<RequireProfile><CityDetail /></RequireProfile>} />
              <Route path="/trips" element={<RequireProfile><Trips /></RequireProfile>} />
              <Route path="/trips/:tripId" element={<RequireProfile><TripDetail /></RequireProfile>} />
              <Route path="/planner/new" element={<RequireProfile><NewTrip /></RequireProfile>} />
              <Route path="/nearby" element={<RequireProfile><Nearby /></RequireProfile>} />
              <Route path="/profile" element={<RequireProfile><Profile /></RequireProfile>} />
            </Route>
            {/* Public share link — no auth required */}
            <Route path="/trip/share/:publicLinkId" element={<PublicTripView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
