import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

const ProtectedRoute = ({ component: Component, ...rest }: ProtectedRouteProps) => {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check local storage first
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    
    if (!isAdminLoggedIn) {
      // No local storage login, redirect to login
      setIsLoading(false);
      setIsAuthenticated(false);
      setLocation("/admin/login");
    } else {
      // Local storage indicates logged in, verify with server if possible
      const checkServerAuth = async () => {
        try {
          const response = await apiRequest("GET", "/api/auth/admin-status");
          
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Server says not authenticated
            localStorage.removeItem("adminLoggedIn");
            setLocation("/admin/login");
          }
        } catch (error) {
          // In case of error, trust local storage
          setIsAuthenticated(true);
          console.warn("Could not verify admin status with server, using local storage");
        } finally {
          setIsLoading(false);
        }
      };
      
      // In development, skip server check
      if (process.env.NODE_ENV === "development") {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        checkServerAuth();
      }
    }
  }, [setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
  }

  return isAuthenticated ? <Component {...rest} /> : null;
};

export default ProtectedRoute; 