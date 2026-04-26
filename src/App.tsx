import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Today from "./pages/Today";
import Auth from "./pages/Auth";
import Checkin from "./pages/Checkin";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import ComingSoon from "./pages/ComingSoon";
import Week from "./pages/Week";
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
          <Route path="/checkin" element={<Checkin />} />
          <Route path="/ovningar" element={<Exercises />} />
          <Route path="/ovningar/:id" element={<ExerciseDetail />} />
          <Route path="/vecka" element={<Week />} />
          <Route path="/journal" element={<ComingSoon title="Journal" body="Tre rader, tankeloop, kropp först och bevislogg." />} />
          <Route path="/vard" element={<ComingSoon title="Vård" body="PHQ-9, GAD-7, WHO-5, mediciner och rapportexport." />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
