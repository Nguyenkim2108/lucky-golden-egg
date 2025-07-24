import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LockKeyhole, User } from "lucide-react";
import "./admin-login.css";

const AdminLogin = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Login mutation
  const { mutate: login, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isAdmin) {
        // Save admin login state
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminUsername", data.username);
        
        // Redirect to admin page
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng quản trị viên!",
        });
        setLocation("/admin");
      } else {
        // Not an admin account
        setLoginError("Tài khoản này không có quyền quản trị viên");
      }
    },
    onError: (error) => {
      setLoginError("Tên đăng nhập hoặc mật khẩu không đúng");
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!username || !password) {
      setLoginError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    login();
  };
  
  return (
    <div className="admin-login-container min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="admin-login-card bg-white dark:bg-gray-800">
          <CardHeader className="space-y-2 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <LockKeyhole className="h-8 w-8 text-blue-600" />
              </div>
            </motion.div>
            <CardTitle className="admin-login-title text-2xl font-bold">
              Đăng nhập quản trị viên
            </CardTitle>
            <CardDescription>
              Vui lòng đăng nhập để truy cập trang quản trị
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {loginError}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="admin-login-button w-full"
                disabled={isPending}
              >
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="admin-login-footer flex flex-col gap-2">
            <div className="text-center text-sm">
              <a 
                href="/" 
                className="hover:underline underline-offset-4"
              >
                Quay lại trang chính
              </a>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin; 