import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import MapAnalytics from "@/pages/MapAnalytics";
import AdminPanel from "@/pages/AdminPanel";
import About from "@/pages/About";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import VerifyDistrictPage from "@/pages/VerifyDistrictPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ruet-sid-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<MapAnalytics />} />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/verify" element={<VerifyDistrictPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
