import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
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
        // Redirect to admin page if user is admin
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng quản trị viên!",
        });
        window.location.href = "/admin";
      } else {
        // Redirect to game page for regular users
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng quay trở lại!",
        });
        window.location.href = "/";
      }
    },
    onError: (error) => {
      toast({
        title: "Đăng nhập thất bại",
        description: "Tên đăng nhập hoặc mật khẩu không đúng.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin.",
        variant: "destructive",
      });
      return;
    }
    
    login();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl bg-white dark:bg-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-center">
              Đăng nhập vào tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600"
                disabled={isPending}
              >
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <div className="text-center text-sm">
              <a 
                href="/" 
                className="hover:underline underline-offset-4"
              >
                Quay lại trang chơi game
              </a>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;