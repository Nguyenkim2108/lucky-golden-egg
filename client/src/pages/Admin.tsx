import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UpdateEggRequest, CreateLinkRequest, LinkResponse, GlobalWinRateConfig, UpdateGlobalWinRateRequest, BulkUpdateWinRatesRequest, BulkUpdateRewardsRequest } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import QRCode from "qrcode";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { formatReward } from "@/lib/game";

// QR Code dialog component
const QRCodeDialog = ({ 
  open, 
  onOpenChange, 
  qrCodeData, 
  qrCodeURL 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  qrCodeData: string; 
  qrCodeURL: string;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Mã QR Code</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center py-4">
        {qrCodeData && (
          <>
            <img src={qrCodeData} alt="QR Code" className="mb-4 border p-2 rounded-md" />
            <p className="text-center text-sm text-gray-500">{qrCodeURL}</p>
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Download QR code image
                  const link = document.createElement('a');
                  link.href = qrCodeData;
                  link.download = 'qrcode.png';
                  link.click();
                }}
              >
                Tải xuống
              </Button>
              <Button 
                size="sm" 
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

interface EggData {
  id: number;
  reward: number;
  broken: boolean;
  winningRate: number;
}

const AdminPage = () => {
  const { toast } = useToast();
  
  // Game eggs state
  const [editingEgg, setEditingEgg] = useState<number | null>(null);
  const [eggReward, setEggReward] = useState<string>("0"); // Thay đổi thành string
  const [eggWinningRate, setEggWinningRate] = useState<number>(100);
  
  // Custom link state
  const [protocol, setProtocol] = useState<string>("https");
  const [domain, setDomain] = useState<string>("");
  const [subdomain, setSubdomain] = useState<string>("");
  const [path, setPath] = useState<string>("");
  
  // QR code dialog state
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  
  // Republish state
  const [republishLink, setRepublishLink] = useState<LinkResponse | null>(null);

  // Global win rate state
  const [globalWinRateEnabled, setGlobalWinRateEnabled] = useState<boolean>(false);
  const [globalWinRate, setGlobalWinRate] = useState<number>(30);
  const [useGroups, setUseGroups] = useState<boolean>(false);
  const [winRateSystemEnabled, setWinRateSystemEnabled] = useState<boolean>(false); // NEW: Master toggle
  const [groupAWinRate, setGroupAWinRate] = useState<number>(20);
  const [groupBWinRate, setGroupBWinRate] = useState<number>(80);
  const [groupAEggs, setGroupAEggs] = useState<number[]>([1, 2, 3, 4]);
  const [groupBEggs, setGroupBEggs] = useState<number[]>([5, 6, 7, 8]);
  const [bulkWinRate, setBulkWinRate] = useState<number>(50);
  const [bulkReward, setBulkReward] = useState<string>("iPhone");
  
  // Fetch all eggs
  const { data: eggs = [], isLoading: eggsLoading } = useQuery<EggData[]>({
    queryKey: ["/api/admin/eggs"],
  });
  
  // Fetch all custom links
  const { data: links = [], isLoading: linksLoading } = useQuery<LinkResponse[]>({
    queryKey: ["/api/admin/links"],
  });

  // Fetch global win rate configuration
  const { data: globalWinRateConfig } = useQuery<GlobalWinRateConfig>({
    queryKey: ["/api/admin/global-win-rate"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/global-win-rate");
      return response.json();
    }
  });

  // Handle logout
  const handleLogout = () => {
    // Remove admin login state
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    
    // Redirect to login page
    window.location.href = "/admin/login";
    
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi trang quản trị",
    });
  };

  
  useEffect(() => {
    if (globalWinRateConfig) {
      setGlobalWinRateEnabled(globalWinRateConfig.enabled);
      setGlobalWinRate(globalWinRateConfig.globalWinRate);
      setUseGroups(globalWinRateConfig.useGroups);
      setWinRateSystemEnabled(globalWinRateConfig.winRateSystemEnabled || false); 
      if (globalWinRateConfig.groups) {
        if (globalWinRateConfig.groups.groupA) {
          setGroupAWinRate(globalWinRateConfig.groups.groupA.winRate);
          setGroupAEggs(globalWinRateConfig.groups.groupA.eggIds);
        }
        if (globalWinRateConfig.groups.groupB) {
          setGroupBWinRate(globalWinRateConfig.groups.groupB.winRate);
          setGroupBEggs(globalWinRateConfig.groups.groupB.eggIds);
        }
      }
    }
  }, [globalWinRateConfig]);
  
  
  const { mutate: updateEggReward } = useMutation({
    mutationFn: async (data: UpdateEggRequest) => {
      const response = await apiRequest("POST", "/api/admin/update-egg", data);
      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Cập nhật thành công",
        description: "Phần thưởng và tỉ lệ trúng thưởng đã được cập nhật.",
      });
      
      // Reset state
      setEditingEgg(null);
      setEggReward("0");
      setEggWinningRate(100);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin quả trứng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Set egg broken state mutation
  const { mutate: setEggBrokenState } = useMutation({
    mutationFn: async (data: { eggId: number; broken: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/set-egg-broken", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Cập nhật thành công",
        description: `Quả trứng #${data.id} đã ${data.broken ? 'được đánh dấu vỡ' : 'được đánh dấu chưa vỡ'}.`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái quả trứng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Create custom link mutation
  const { mutate: createCustomLink } = useMutation({
    mutationFn: async (data: CreateLinkRequest) => {
      const response = await apiRequest("POST", "/api/admin/create-link", data);
      return response.json();
    },
    onSuccess: (data: LinkResponse) => {
      // Show success message
      toast({
        title: "Tạo link thành công",
        description: "Link mới đã được tạo.",
      });
      
      // Generate QR code for the new link
      let fullSubdomain = subdomain ? `${subdomain}.` : "";
      const fullUrl = `${protocol}://${fullSubdomain}${data.domain}${data.path || ''}?linkId=${data.id}`;
      
      QRCode.toDataURL(fullUrl, { margin: 2 }, (err, url) => {
        if (err) {
          console.error('Error generating QR code:', err);
          return;
        }
        
        // Open QR code dialog
        setQrCodeData(url);
        setQrCodeURL(fullUrl);
        setShowQRCode(true);
      });
      
      // Reset form
      setSubdomain("");
      setPath("");
      
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo link. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Delete custom link mutation
  const { mutate: deleteCustomLink } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/links/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Xóa link thành công",
        description: "Link đã được xóa.",
      });

      // Invalidate query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa link. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });

  // Update global win rate configuration mutation
  const { mutate: updateGlobalWinRateConfig } = useMutation({
    mutationFn: async (data: UpdateGlobalWinRateRequest) => {
      const response = await apiRequest("POST", "/api/admin/global-win-rate", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Cấu hình tỉ lệ trúng thưởng toàn cục đã được cập nhật.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-win-rate"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình tỉ lệ trúng thưởng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });

  // Bulk update egg win rates mutation
  const { mutate: bulkUpdateWinRates } = useMutation({
    mutationFn: async (data: BulkUpdateWinRatesRequest) => {
      const response = await apiRequest("POST", "/api/admin/bulk-update-win-rates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Tỉ lệ trúng thưởng của tất cả trứng đã được cập nhật.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tỉ lệ trúng thưởng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });

  // Bulk update egg rewards mutation
  const { mutate: bulkUpdateRewards } = useMutation({
    mutationFn: async (data: BulkUpdateRewardsRequest) => {
      const response = await apiRequest("POST", "/api/admin/bulk-update-rewards", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Phần thưởng của tất cả trứng đã được cập nhật.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eggs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phần thưởng. Hãy thử lại.",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit egg
  const handleEditEgg = (egg: EggData) => {
    setEditingEgg(egg.id);
    setEggReward(String(egg.reward)); // Convert to string
    setEggWinningRate(egg.winningRate);
  };
  
  // Handle save egg reward
  const handleSaveEggReward = () => {
    if (editingEgg === null) return;
    
    updateEggReward({
      eggId: editingEgg,
      reward: eggReward,
      winningRate: eggWinningRate
    });
  };
  
  // Handle create custom link
  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCustomLink({
      domain,
      subdomain: subdomain || "",
      path,
      eggId: 0, // Không chỉ định quả trứng cụ thể
      protocol // Gửi protocol đã chọn
    });
  };
  
  // Handle delete link
  const handleDeleteLink = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa link này không?")) {
      deleteCustomLink(id);
    }
  };
  
  // Format reward as string
  const formatReward = (reward: number | string) => {
    if (typeof reward === 'string') {
      return reward;
    }
    return reward.toFixed(2);
  };
  
  // Generate custom link options
  const generateLinkOption = (link: LinkResponse) => {
    let fullSubdomain = link.subdomain ? `${link.subdomain}.` : "";
    // Đảm bảo path không bắt đầu bằng dấu / nếu được cung cấp
    let formattedPath = link.path || '';
    if (formattedPath && !formattedPath.startsWith('/')) {
      formattedPath = '/' + formattedPath;
    }
    return `${link.protocol || 'https'}://${fullSubdomain}${link.domain}${formattedPath}?linkId=${link.id}`;
  };
  
  // Hiển thị preview URL
  const previewUrl = () => {
    let fullSubdomain = subdomain ? `${subdomain}.` : "";
    // Đảm bảo path không bắt đầu bằng dấu / nếu được cung cấp
    let formattedPath = path || '';
    if (formattedPath && !formattedPath.startsWith('/')) {
      formattedPath = '/' + formattedPath;
    }
    return `${protocol}://${fullSubdomain}${domain}${formattedPath}`;
  };
  
  // Generate QR code for an existing link
  const generateQRCode = (link: LinkResponse) => {
    let fullSubdomain = link.subdomain ? `${link.subdomain}.` : "";
    // Đảm bảo path không bắt đầu bằng dấu / nếu được cung cấp
    let formattedPath = link.path || '';
    if (formattedPath && !formattedPath.startsWith('/')) {
      formattedPath = '/' + formattedPath;
    }
    const fullUrl = `${link.protocol || 'https'}://${fullSubdomain}${link.domain}${formattedPath}?linkId=${link.id}`;
    
    QRCode.toDataURL(fullUrl, { margin: 2 }, (err, url) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return;
      }
      
      // Open QR code dialog
      setQrCodeData(url);
      setQrCodeURL(fullUrl);
      setShowQRCode(true);
    });
  };
  
  // Handle toggle egg broken state
  const handleToggleEggBrokenState = (egg: EggData) => {
    if (confirm(`Bạn có chắc muốn ${egg.broken ? 'khôi phục' : 'đánh dấu vỡ'} quả trứng #${egg.id} không?`)) {
      setEggBrokenState({
        eggId: egg.id,
        broken: !egg.broken
      });
    }
  };

  // Handle global win rate configuration update
  const handleUpdateGlobalWinRate = () => {
    const config: UpdateGlobalWinRateRequest = {
      enabled: globalWinRateEnabled,
      globalWinRate: globalWinRate,
      useGroups: useGroups,
      winRateSystemEnabled: winRateSystemEnabled // NEW: Include master toggle
    };

    if (useGroups) {
      config.groups = {
        groupA: {
          winRate: groupAWinRate,
          eggIds: groupAEggs
        },
        groupB: {
          winRate: groupBWinRate,
          eggIds: groupBEggs
        }
      };
    }

    updateGlobalWinRateConfig(config);
  };

  // Handle bulk update win rates
  const handleBulkUpdateWinRates = () => {
    if (confirm(`Bạn có chắc muốn áp dụng tỉ lệ trúng thưởng ${bulkWinRate}% cho tất cả 8 quả trứng không?`)) {
      bulkUpdateWinRates({ winningRate: bulkWinRate });
    }
  };

  // Handle bulk update rewards
  const handleBulkUpdateRewards = () => {
    if (confirm(`Bạn có chắc muốn áp dụng phần thưởng "${bulkReward}" cho tất cả 8 quả trứng không?`)) {
      bulkUpdateRewards({ reward: bulkReward });
    }
  };

  // Helper function to get egg group info
  const getEggGroupInfo = (eggId: number) => {
    if (!globalWinRateEnabled || !useGroups) return null;

    if (groupAEggs.includes(eggId)) {
      return { group: 'A', winRate: groupAWinRate, color: 'bg-blue-100 text-blue-800' };
    } else if (groupBEggs.includes(eggId)) {
      return { group: 'B', winRate: groupBWinRate, color: 'bg-green-100 text-green-800' };
    }
    return null;
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* QR Code Dialog */}
      <QRCodeDialog 
        open={showQRCode} 
        onOpenChange={setShowQRCode} 
        qrCodeData={qrCodeData} 
        qrCodeURL={qrCodeURL}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Trang quản trị</h1>
        <div className="flex space-x-3">
          <Button 
            variant="destructive"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
          <a 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Quay lại trang chính
          </a>
        </div>
      </div>
      
      <Tabs defaultValue="global-win-rate">
        <TabsList className="mb-4">
          <TabsTrigger value="global-win-rate">Tỉ lệ trúng thưởng toàn cục</TabsTrigger>
          <TabsTrigger value="eggs">Cài đặt phần thưởng</TabsTrigger>
          <TabsTrigger value="links">Quản lý link</TabsTrigger>
        </TabsList>

        {/* Global Win Rate tab content */}
        <TabsContent value="global-win-rate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Win Rate Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình tỉ lệ trúng thưởng toàn cục</CardTitle>
                <CardDescription>
                  Thiết lập tỉ lệ trúng thưởng áp dụng cho tất cả các quả trứng thay vì cài đặt riêng lẻ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* NEW: Master Win Rate System Toggle */}
                <div className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold text-orange-800">Hệ thống tỉ lệ trúng thưởng</Label>
                    <div className="text-sm text-orange-700">
                      <strong>BẬT:</strong> Áp dụng tỉ lệ trúng thưởng (có thể thua) | <strong>TẮT:</strong> Luôn trả thưởng 100% (đảm bảo kết quả)
                    </div>
                  </div>
                  <Switch
                    checked={winRateSystemEnabled}
                    onCheckedChange={setWinRateSystemEnabled}
                  />
                </div>

                {!winRateSystemEnabled && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm text-green-800">
                      <strong>🎯 Chế độ đảm bảo kết quả:</strong> Tất cả trứng sẽ luôn trả về phần thưởng đã cấu hình với xác suất 100%.
                      Không có yếu tố ngẫu nhiên - mọi trứng đều đảm bảo trúng thưởng.
                    </div>
                  </div>
                )}

                {winRateSystemEnabled && (
                  <>
                    <Separator />

                    {/* Enable Global Win Rate */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Kích hoạt tỉ lệ trúng thưởng toàn cục</Label>
                        <div className="text-sm text-muted-foreground">
                          Khi bật, tỉ lệ trúng thưởng toàn cục sẽ ghi đè tỉ lệ riêng lẻ của từng trứng
                        </div>
                      </div>
                      <Switch
                        checked={globalWinRateEnabled}
                        onCheckedChange={setGlobalWinRateEnabled}
                      />
                    </div>
                  </>
                )}

                {winRateSystemEnabled && globalWinRateEnabled && (
                  <>
                    <Separator />

                    {/* Configuration Mode */}
                    <div className="space-y-3">
                      <Label className="text-base">Chế độ cấu hình</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="single-rate"
                            name="config-mode"
                            checked={!useGroups}
                            onChange={() => setUseGroups(false)}
                          />
                          <Label htmlFor="single-rate">Tỉ lệ trúng thưởng chung cho tất cả trứng</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="group-rates"
                            name="config-mode"
                            checked={useGroups}
                            onChange={() => setUseGroups(true)}
                          />
                          <Label htmlFor="group-rates">Tỉ lệ trúng thưởng theo nhóm tùy chỉnh</Label>
                        </div>
                      </div>
                    </div>

                    {!useGroups ? (
                      /* Single Global Rate */
                      <div className="space-y-3">
                        <Label className="text-base">Tỉ lệ trúng thưởng toàn cục (%)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[globalWinRate]}
                            onValueChange={(values) => setGlobalWinRate(values[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={globalWinRate}
                            onChange={(e) => setGlobalWinRate(Number(e.target.value))}
                            className="w-20"
                          />
                          <span>%</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tất cả 8 quả trứng sẽ có tỉ lệ trúng thưởng {globalWinRate}%
                        </div>
                      </div>
                    ) : (
                      /* Group-based Rates */
                      <div className="space-y-6">
                        {/* Group A Configuration */}
                        <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold text-blue-800">Nhóm A</Label>
                            <span className="text-sm text-blue-600">{groupAWinRate}% tỉ lệ trúng</span>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm">Tỉ lệ trúng thưởng (%)</Label>
                            <div className="flex items-center space-x-4">
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[groupAWinRate]}
                                onValueChange={(values) => setGroupAWinRate(values[0])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={groupAWinRate}
                                onChange={(e) => setGroupAWinRate(Number(e.target.value))}
                                className="w-20"
                              />
                              <span>%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Trứng được gán vào Nhóm A</Label>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(eggId => (
                                <button
                                  key={eggId}
                                  onClick={() => {
                                    if (groupAEggs.includes(eggId)) {
                                      setGroupAEggs(groupAEggs.filter(id => id !== eggId));
                                    } else {
                                      setGroupAEggs([...groupAEggs, eggId]);
                                      setGroupBEggs(groupBEggs.filter(id => id !== eggId));
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    groupAEggs.includes(eggId)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Trứng {eggId}
                                </button>
                              ))}
                            </div>
                            <div className="text-xs text-blue-600">
                              Đã chọn: {groupAEggs.length > 0 ? groupAEggs.sort().join(', ') : 'Chưa có trứng nào'}
                            </div>
                          </div>
                        </div>

                        {/* Group B Configuration */}
                        <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold text-green-800">Nhóm B</Label>
                            <span className="text-sm text-green-600">{groupBWinRate}% tỉ lệ trúng</span>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm">Tỉ lệ trúng thưởng (%)</Label>
                            <div className="flex items-center space-x-4">
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[groupBWinRate]}
                                onValueChange={(values) => setGroupBWinRate(values[0])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={groupBWinRate}
                                onChange={(e) => setGroupBWinRate(Number(e.target.value))}
                                className="w-20"
                              />
                              <span>%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Trứng được gán vào Nhóm B</Label>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(eggId => (
                                <button
                                  key={eggId}
                                  onClick={() => {
                                    if (groupBEggs.includes(eggId)) {
                                      setGroupBEggs(groupBEggs.filter(id => id !== eggId));
                                    } else {
                                      setGroupBEggs([...groupBEggs, eggId]);
                                      setGroupAEggs(groupAEggs.filter(id => id !== eggId));
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    groupBEggs.includes(eggId)
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Trứng {eggId}
                                </button>
                              ))}
                            </div>
                            <div className="text-xs text-green-600">
                              Đã chọn: {groupBEggs.length > 0 ? groupBEggs.sort().join(', ') : 'Chưa có trứng nào'}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <strong>Lưu ý:</strong> Mỗi trứng chỉ có thể thuộc về một nhóm. Khi bạn chọn trứng cho một nhóm, nó sẽ tự động bị loại khỏi nhóm khác.
                        </div>
                      </div>
                    )}

                    <Button onClick={handleUpdateGlobalWinRate} className="w-full">
                      Cập nhật cấu hình toàn cục
                    </Button>
                  </>
                )}

                {/* Save button for win rate system toggle - always show when system is enabled */}
                <Button onClick={handleUpdateGlobalWinRate} className="w-full">
                  Lưu cấu hình hệ thống tỉ lệ trúng thưởng
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Update Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Công cụ cập nhật hàng loạt</CardTitle>
                <CardDescription>
                  Áp dụng cùng một tỉ lệ trúng thưởng cho tất cả các quả trứng (chế độ riêng lẻ).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base">Tỉ lệ trúng thưởng cho tất cả trứng (%)</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[bulkWinRate]}
                      onValueChange={(values) => setBulkWinRate(values[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={bulkWinRate}
                      onChange={(e) => setBulkWinRate(Number(e.target.value))}
                      className="w-20"
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Thao tác này sẽ cập nhật tỉ lệ trúng thưởng riêng lẻ của tất cả 8 quả trứng.
                    Nếu bạn đang sử dụng tỉ lệ trúng thưởng toàn cục, hãy sử dụng cấu hình bên trái thay thế.
                  </div>
                </div>

                <Button
                  onClick={handleBulkUpdateWinRates}
                  variant="outline"
                  className="w-full"
                  disabled={globalWinRateEnabled}
                >
                  Áp dụng cho tất cả trứng
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Eggs tab content */}
        <TabsContent value="eggs">
          {/* Bulk Reward Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cấu hình phần thưởng hàng loạt</CardTitle>
              <CardDescription>
                Áp dụng cùng một phần thưởng cho tất cả 8 quả trứng cùng lúc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base">Phần thưởng cho tất cả trứng</Label>
                <Input
                  type="text"
                  value={bulkReward}
                  onChange={(e) => setBulkReward(e.target.value)}
                  placeholder="Nhập phần thưởng (vd: iPhone, 100, MacBook Pro)"
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  Bạn có thể nhập văn bản (như "iPhone") hoặc số (như "100"). Phần thưởng này sẽ được áp dụng cho tất cả 8 quả trứng.
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  <strong>Lưu ý:</strong> Với hệ thống phần thưởng được đảm bảo 100%, mọi quả trứng sẽ luôn trả về phần thưởng đã cấu hình.
                  Thao tác này chỉ thay đổi phần thưởng và giữ nguyên tỉ lệ trúng thưởng hiện tại.
                </div>
              </div>

              <Button
                onClick={handleBulkUpdateRewards}
                className="w-full"
                disabled={!bulkReward.trim()}
              >
                Áp dụng phần thưởng cho tất cả trứng
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Các quả trứng vàng</CardTitle>
              <CardDescription>
                Điều chỉnh phần thưởng và tỉ lệ trúng thưởng cho từng quả trứng vàng.
                {globalWinRateEnabled && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Tỉ lệ trúng thưởng toàn cục đang được kích hoạt.
                      {useGroups ? (
                        <div className="mt-2">
                          <div>• Nhóm A ({groupAWinRate}%): Trứng {groupAEggs.length > 0 ? groupAEggs.sort().join(', ') : 'chưa có'}</div>
                          <div>• Nhóm B ({groupBWinRate}%): Trứng {groupBEggs.length > 0 ? groupBEggs.sort().join(', ') : 'chưa có'}</div>
                        </div>
                      ) : (
                        <span> Tất cả trứng sử dụng tỉ lệ {globalWinRate}%.</span>
                      )}
                    </div>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableCaption>Danh sách quả trứng vàng</TableCaption>
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[120px]">Phần thưởng</TableHead>
                    <TableHead>Tỉ lệ trúng thưởng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eggsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : (
                    eggs.map((egg) => (
                      <TableRow key={egg.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>Trứng #{egg.id}</span>
                            {(() => {
                              const groupInfo = getEggGroupInfo(egg.id);
                              return groupInfo ? (
                                <span className={`px-2 py-1 text-xs rounded-full ${groupInfo.color}`}>
                                  Nhóm {groupInfo.group} ({groupInfo.winRate}%)
                                </span>
                              ) : null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingEgg === egg.id ? (
                            <Input
                              type="text"
                              value={eggReward}
                              onChange={(e) => setEggReward(e.target.value)}
                              className="w-32"
                              placeholder="Nhập phần thưởng"
                            />
                          ) : (
                            formatReward(egg.reward)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEgg === egg.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={eggWinningRate}
                                onChange={(e) => setEggWinningRate(Number(e.target.value))}
                                className="w-20"
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <span className="text-sm">{egg.winningRate}%</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${egg.broken ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {egg.broken ? 'Đã vỡ' : 'Chưa vỡ'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingEgg === egg.id ? (
                            <div className="flex justify-end space-x-2">
                              <Button 
                                size="sm"
                                onClick={handleSaveEggReward}
                              >
                                Lưu
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingEgg(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditEgg(egg)}
                              >
                                Sửa
                              </Button>
                              <Button 
                                variant={egg.broken ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleEggBrokenState(egg)}
                              >
                                {egg.broken ? 'Khôi phục' : 'Đánh dấu vỡ'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Links tab content */}
        <TabsContent value="links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create link form */}
            <Card>
              <CardHeader>
                <CardTitle>Tạo link mới</CardTitle>
                <CardDescription>
                  Tạo link truy cập cho người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Giao thức</Label>
                    <RadioGroup 
                      defaultValue="https" 
                      value={protocol}
                      onValueChange={setProtocol}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="http" id="http" />
                        <Label htmlFor="http">HTTP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="https" id="https" />
                        <Label htmlFor="https">HTTPS</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                      <div className="space-y-2">
                    <Label htmlFor="subdomain">Tên miền phụ (không bắt buộc)</Label>
                        <Input
                          id="subdomain"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="vd: player123"
                        />
                      </div>
                  
                      <div className="space-y-2">
                    <Label htmlFor="domain">Tên miền</Label>
                        <Input
                          id="domain"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                      required
                        />
                      </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="path">Đường dẫn tùy chỉnh</Label>
                        <Input
                          id="path"
                          value={path}
                          onChange={(e) => setPath(e.target.value)}
                          placeholder="vd: emoidapdi, game123, ..."
                          className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="text-sm text-blue-600">
                          <strong>Mới:</strong> Bạn có thể tùy chỉnh đường dẫn để tạo link dễ nhớ. 
                          Ví dụ: <span className="font-semibold">{domain || 'daptrungvang.com'}/emoidapdi</span>
                        </div>
                      </div>
                  
                  <div className="p-2 border rounded-md bg-gray-50">
                    <p className="text-sm text-gray-700">Preview: {previewUrl()}</p>
                    </div>

                  
                  
                  <Button type="submit" className="w-full">
                    Tạo link
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Links list */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách link</CardTitle>
                <CardDescription>
                  Quản lý các link đã tạo.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                  <Table>
                  <TableCaption>Danh sách link</TableCaption>
                    <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linksLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Đang tải...</TableCell>
                      </TableRow>
                    ) : links.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Chưa có link nào.</TableCell>
                      </TableRow>
                    ) : (
                      links.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="text-xs truncate max-w-[120px]">
                            <a 
                                href={generateLinkOption(link)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                                title={generateLinkOption(link)}
                            >
                                {link.subdomain ? link.subdomain : link.domain}
                            </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${link.used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {link.used ? 'Đã dùng' : 'Chưa dùng'}
                              </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                                onClick={() => generateQRCode(link)}
                                title="Tạo QR Code"
                              >
                                QR
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                  // Copy link to clipboard
                                  navigator.clipboard.writeText(generateLinkOption(link));
                                    toast({
                                    title: "Đã sao chép",
                                    description: "Link đã được sao chép vào clipboard.",
                                  });
                              }}
                                title="Sao chép link"
                            >
                                URL
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                                title="Xóa link"
                            >
                              Xóa
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;