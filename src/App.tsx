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
import Planner from "@/pages/Planner";
import Saved from "@/pages/Saved";
import Advisor from "@/pages/Advisor";
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
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route element={<Layout />}>
              <Route path="/" element={<RequireProfile><Home /></RequireProfile>} />
              <Route path="/destinations" element={<RequireProfile><Destinations /></RequireProfile>} />
              <Route path="/city/:cityId" element={<RequireProfile><CityDetail /></RequireProfile>} />
              <Route path="/planner" element={<RequireProfile><Planner /></RequireProfile>} />
              <Route path="/saved" element={<RequireProfile><Saved /></RequireProfile>} />
              <Route path="/advisor" element={<RequireProfile><Advisor /></RequireProfile>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
