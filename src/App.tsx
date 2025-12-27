import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import InstitutionRegister from "./pages/institution/InstitutionRegister";
import InstitutionLogin from "./pages/institution/InstitutionLogin";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import IssueCertificate from "./pages/institution/IssueCertificate";
import BatchUpload from "./pages/institution/BatchUpload";
import UserPortal from "./pages/user/UserPortal";
import VerifyPortal from "./pages/verify/VerifyPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/institution" element={<InstitutionLogin />} />
          <Route path="/institution/register" element={<InstitutionRegister />} />
          <Route path="/institution/login" element={<InstitutionLogin />} />
          <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
          <Route path="/institution/issue" element={<IssueCertificate />} />
          <Route path="/institution/batch" element={<BatchUpload />} />
          <Route path="/user" element={<UserPortal />} />
          <Route path="/verify" element={<VerifyPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;