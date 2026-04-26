import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Today from "./pages/Today";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Checkin from "./pages/Checkin";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import Week from "./pages/Week";
import Journal from "./pages/Journal";
import Vard from "./pages/Vard";
import Learn from "./pages/Learn";
import LearnArticle from "./pages/LearnArticle";
import Sequences from "./pages/Sequences";
import CrisisPlan from "./pages/CrisisPlan";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/installningar" element={<Settings />} />
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/ovningar" element={<Exercises />} />
          <Route path="/ovningar/:id" element={<ExerciseDetail />} />
          <Route path="/vecka" element={<Week />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/vard" element={<Vard />} />
          <Route path="/lar-dig" element={<Learn />} />
          <Route path="/lar-dig/:slug" element={<LearnArticle />} />
          <Route path="/rutiner" element={<Sequences />} />
          <Route path="/krisplan" element={<CrisisPlan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
