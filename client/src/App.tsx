import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Game from "@/pages/Game";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/admin/Login";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={props => <ProtectedRoute component={Admin} {...props} />} />
      {/* Thêm route để hỗ trợ các đường dẫn tùy chỉnh */}
      <Route path="/:customPath+" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
