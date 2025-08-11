import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import PublicVideoView from "./pages/PublicVideoView";

const queryClient = new QueryClient();

function getSubdomain() {
  const host = window.location.hostname;
  const parts = host.split(".");
  // e.g. username.vidfaq.com
  if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "vidfaq") return parts[0];
  return null;
}

const App = () => {
  const subdomain = getSubdomain();
  if (subdomain) {
    // Get the path after the subdomain
    const path = window.location.pathname;
    // If path is "/" or empty, show profile
    if (path === "/" || path === "") {
      return <PublicProfile />;
    }
    // If path is "/[slug]", show video view
    const slugMatch = path.match(/^\/(.+)$/);
    if (slugMatch) {
      // Pass slug as prop
      return <PublicVideoView slug={slugMatch[1]} />;
    }
    // Fallback to profile
    return <PublicProfile />;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/video/:slug" element={<PublicVideoView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
