import { 
  GameState, 
  User, 
  CustomLink, 
  UpdateEggRequest, 
  CreateLinkRequest, 
  LinkResponse,
  GameLinkInfo,
  RevealAllEggsResult,
  EggData as SchemaEggData 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, customLinks } from "@shared/schema";

// Constants for game logic
const TOTAL_EGGS = 8; // Đồng bộ với frontend - chỉ hiển thị 8 quả trứng
const MIN_REWARD = 50;
const MAX_REWARD = 500;
const DEFAULT_DOMAIN = "dammedaga.fun";
const DEFAULT_WINNING_RATE = 100; // Tỉ lệ mặc định 100%

// Global win rate configuration
interface GlobalWinRateConfig {
  enabled: boolean;
  globalWinRate: number; // Global win percentage (0-100)
  useGroups: boolean; // Whether to use custom groups instead of global rate
  winRateSystemEnabled: boolean; // NEW: Master toggle for win rate system (ON/OFF)
  groups?: {
    groupA: {
      winRate: number; // Win rate for Group A (0-100)
      eggIds: number[]; // Array of egg IDs assigned to Group A
    };
    groupB: {
      winRate: number; // Win rate for Group B (0-100)
      eggIds: number[]; // Array of egg IDs assigned to Group B
    };
  };
}

// Interface for egg data
interface EggData {
  id: number;
  reward: number | string; // Cho phép cả số và text
  broken: boolean;
  winningRate: number; // Tỉ lệ trúng thưởng cho mỗi quả trứng
  allowed?: boolean;
  manuallyBroken?: boolean; // Trạng thái đã vỡ được đặt thủ công bởi admin
}

// Interface for break egg result
interface BreakEggResult {
  eggId: number;
  reward: number | string; // Cho phép cả số và text
  success: boolean;
}

// Interface for claim rewards result
interface ClaimRewardsResult {
  totalReward: number;
  success: boolean;
}

// Interface for admin operations
interface AdminOperations {
  // Admin methods
  updateEggReward(eggId: number, reward: number, winningRate: number): Promise<EggData>;
  getAllEggs(): Promise<EggData[]>;
  createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse>;
  getCustomLinks(): Promise<LinkResponse[]>;
  deleteCustomLink(id: number): Promise<boolean>;
  setEggBrokenState(eggId: number, broken: boolean): Promise<EggData>;

  // Global win rate methods
  getGlobalWinRateConfig(): Promise<GlobalWinRateConfig>;
  updateGlobalWinRateConfig(config: Partial<GlobalWinRateConfig>): Promise<GlobalWinRateConfig>;
  bulkUpdateEggWinRates(winningRate: number): Promise<EggData[]>;
  bulkUpdateEggRewards(reward: number | string): Promise<EggData[]>;
}

// Extend storage interface with game methods
export interface IStorage extends AdminOperations {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; isAdmin?: boolean }): Promise<User>;
  
  // Game specific methods
  getGameState(linkId?: number): Promise<GameState>;
  breakEgg(eggId: number, linkId?: number): Promise<BreakEggResult>;
  revealAllEggs(linkId: number, brokenEggId: number, actualReward: number | string): Promise<RevealAllEggsResult>;
  claimRewards(): Promise<ClaimRewardsResult>;
  resetGame(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private eggs: Map<number, EggData>;
  private brokenEggs: number[];
  private totalReward: number;
  private deadline: number;
  private customLinks: Map<number, CustomLink>;
  currentId: number;

  // Global win rate configuration
  private globalWinRateConfig: GlobalWinRateConfig = {
    enabled: false,
    globalWinRate: 30, // Default 30% global win rate
    useGroups: false,
    winRateSystemEnabled: false, // NEW: Default to OFF (force predetermined results)
    groups: {
      groupA: {
        winRate: 20, // Default 20% for Group A
        eggIds: [1, 2, 3, 4] // Default assignment: eggs 1-4 to Group A
      },
      groupB: {
        winRate: 80, // Default 80% for Group B
        eggIds: [5, 6, 7, 8] // Default assignment: eggs 5-8 to Group B
      }
    }
  };

  constructor() {
    this.users = new Map();
    this.eggs = new Map();
    this.brokenEggs = [];
    this.totalReward = 0;
    this.deadline = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    this.currentId = 1;
    this.customLinks = new Map();
    
    // Initialize eggs
    this.initializeEggs();

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Tạo một Custom Link mẫu
    this.createCustomLink({
      domain: DEFAULT_DOMAIN,
      subdomain: "demo",
      path: "",
      eggId: 0,
      protocol: "https"
    });
  }

  // Initialize eggs with random rewards
  private initializeEggs(): void {
    for (let i = 1; i <= TOTAL_EGGS; i++) {
      const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1) + MIN_REWARD);
      this.eggs.set(i, {
        id: i,
        reward,
        broken: false,
        winningRate: DEFAULT_WINNING_RATE // Mỗi quả trứng có tỉ lệ mặc định là 100%
      });
    }
  }
  
  // Calculate progress percentage
  private calculateProgress(): number {
    return (this.brokenEggs.length / TOTAL_EGGS) * 100;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: { username: string; password: string; isAdmin?: boolean }): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      score: 0,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Game methods
  async getGameState(linkId?: number): Promise<GameState> {
    let allowedEggId: number | undefined;
    let linkUsed = false;

    // Nếu có linkId, tìm thông tin link để xác định egg được phép đập
    if (linkId) {
      const link = this.customLinks.get(linkId);
      if (link) {
        allowedEggId = link.eggId;
        linkUsed = link.used;
      }
    }

    // Copy trạng thái eggs và đánh dấu quả được phép đập
    const allEggs = Array.from(this.eggs.values()).map(egg => {
      // Nếu link đã được sử dụng, tính toán reward dựa trên winning rate
      // để hiển thị chính xác trạng thái trứng
      if (linkUsed) {
        const calculatedReward = egg.winningRate > 0 ? egg.reward : 0;
        return {
          id: egg.id,
          broken: egg.broken,
          reward: calculatedReward, // Hiển thị 0 cho trứng 0% win rate
          winningRate: egg.winningRate,
          allowed: allowedEggId ? egg.id === allowedEggId : undefined
        };
      }

      // Link chưa sử dụng, hiển thị reward gốc
      return {
        id: egg.id,
        broken: egg.broken,
        reward: egg.reward,
        winningRate: egg.winningRate,
        allowed: allowedEggId ? egg.id === allowedEggId : undefined
      };
    });

    return {
      deadline: this.deadline,
      brokenEggs: this.brokenEggs,
      progress: this.calculateProgress(),
      eggs: allEggs,
      allowedEggId,
      linkId,
      linkUsed
    };
  }
  
  async breakEgg(eggId: number, linkId?: number): Promise<BreakEggResult> {
    // Nếu có linkId, kiểm tra xem link có tồn tại và đã sử dụng chưa
    if (linkId) {
      const link = this.customLinks.get(linkId);
      
      if (!link) {
        throw new Error(`Link với ID ${linkId} không tồn tại`);
  }
  
      if (link.used) {
        throw new Error(`Link với ID ${linkId} đã được sử dụng`);
      }
      
      // Đánh dấu link đã sử dụng, không cần kiểm tra eggId nữa
      link.used = true;
      this.customLinks.set(linkId, link);
    }
    
    // Check if egg exists
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }
    
    // Check if egg is already broken
    if (egg.broken || this.brokenEggs.includes(eggId)) {
      throw new Error(`Egg with ID ${eggId} is already broken`);
    }
    
    // NEW: Configurable Win Rate System
    let reward: number | string;

    if (this.globalWinRateConfig.winRateSystemEnabled) {
      // Win rate system is ON - apply win rate calculations
      let winRate = egg.winningRate; // Default to individual egg win rate

      // Check if global win rate is enabled
      if (this.globalWinRateConfig.enabled) {
        if (this.globalWinRateConfig.useGroups && this.globalWinRateConfig.groups) {
          // Use group-based win rates
          const groupA = this.globalWinRateConfig.groups.groupA;
          const groupB = this.globalWinRateConfig.groups.groupB;

          if (groupA.eggIds.includes(eggId)) {
            winRate = groupA.winRate;
          } else if (groupB.eggIds.includes(eggId)) {
            winRate = groupB.winRate;
          }
        } else {
          // Use global win rate
          winRate = this.globalWinRateConfig.globalWinRate;
        }
      }

      // Apply win rate calculation
      const randomValue = Math.random() * 100;
      if (randomValue <= winRate) {
        reward = egg.reward; // Win - return configured reward
        console.log(`🎯 Egg #${eggId} - WIN (${randomValue.toFixed(1)}% <= ${winRate}%) - Reward: ${reward}`);
      } else {
        reward = 0; // Lose - return no reward
        console.log(`❌ Egg #${eggId} - LOSE (${randomValue.toFixed(1)}% > ${winRate}%) - No reward`);
      }
    } else {
      // Win rate system is OFF - force predetermined results (always return configured reward)
      reward = egg.reward;
      console.log(`💰 Egg #${eggId} - Force predetermined result - Always returning configured reward: ${reward}`);
    }
    
    // Mark egg as broken
    egg.broken = true;
    this.brokenEggs.push(eggId);
    
    // Add reward to total (nếu trúng thưởng và là số)
    if (typeof reward === 'number') {
      this.totalReward += reward;
    }
    
    // Update egg in map
    this.eggs.set(eggId, egg);
    
    // Return result
    return {
      eggId,
      reward: reward, // Always return the configured reward (100% guaranteed)
      success: true,
    };
  }
  
  // Hàm mới để tiết lộ tất cả các quả trứng sau khi đập 1 quả
  async revealAllEggs(linkId: number, brokenEggId: number, actualReward: number | string): Promise<RevealAllEggsResult> {
    const link = this.customLinks.get(linkId);
    if (!link) {
      throw new Error(`Link với ID ${linkId} không tồn tại`);
    }

    // Lấy quả trứng được đập
    const egg = this.eggs.get(brokenEggId);
    if (!egg) {
      throw new Error(`Egg with ID ${brokenEggId} does not exist`);
    }

    // FORCE PREDETERMINED RESULTS: Always show configured rewards for all eggs
    // Remove all win rate calculations and always display the exact configured reward

    // Reveal all eggs with their configured rewards (no randomization)
    const allEggs = Array.from(this.eggs.values()).map(egg => {
      // If this is the broken egg, use the actualReward that was already calculated
      if (egg.id === brokenEggId) {
        return {
          ...egg,
          reward: actualReward, // Use the guaranteed reward from breakEgg()
          broken: true,
          allowed: true
        };
      }

      // For all other eggs: always show their configured reward (no win rate logic)
      return {
        ...egg,
        reward: egg.reward, // Always show the configured reward (100% guaranteed)
        allowed: false
      };
    });

    return {
      eggs: allEggs,
      brokenEggId,
      reward: actualReward, // Always return the guaranteed configured reward
      success: true
    };
  }
  
  async claimRewards(): Promise<ClaimRewardsResult> {
    // Check if there are rewards to claim
    if (this.totalReward <= 0) {
      throw new Error("No rewards to claim");
    }
    
    // Get total reward
    const totalReward = this.totalReward;
    
    // Reset game state
    this.resetGameState();
    
    // Return result
    return {
      totalReward,
      success: true,
    };
  }
  
  async resetGame(): Promise<void> {
    this.resetGameState();
  }
  
  private resetGameState(): void {
    // Reset eggs - chỉ reset trạng thái broken, giữ nguyên winningRate và reward đã cài đặt
    this.eggs.forEach((egg, id) => {
      egg.broken = false;
      egg.manuallyBroken = false;
      this.eggs.set(id, egg);
    });

    // Reset broken eggs and total reward
    this.brokenEggs = [];
    this.totalReward = 0;

    // Reset deadline (24 hours from now)
    this.deadline = Date.now() + 24 * 60 * 60 * 1000;
  }

  // Admin methods
  async updateEggReward(eggId: number, reward: number | string, winningRate: number): Promise<EggData> {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }

    // Validate winning rate
    if (winningRate < 0 || winningRate > 100) {
      throw new Error("Tỉ lệ trúng thưởng phải từ 0 đến 100");
    }

    console.log(`⚙️ Admin Update - Egg #${eggId}: Reward ${egg.reward} → ${reward}, WinningRate ${egg.winningRate}% → ${winningRate}%`);

    // Update reward và tỉ lệ trúng thưởng
    egg.reward = reward;
    egg.winningRate = winningRate;

    this.eggs.set(eggId, egg);

    console.log(`✅ Admin Update Complete - Egg #${eggId}: Reward=${reward}, WinningRate=${winningRate}%`);

    return egg;
  }

  // Thêm phương thức mới để thiết lập trạng thái vỡ của quả trứng
  async setEggBrokenState(eggId: number, broken: boolean): Promise<EggData> {
    const egg = this.eggs.get(eggId);
    if (!egg) {
      throw new Error(`Egg with ID ${eggId} does not exist`);
    }

    // Cập nhật trạng thái broken
    egg.broken = broken;
    egg.manuallyBroken = broken; // Đánh dấu đã được thay đổi thủ công
    
    // Cập nhật danh sách brokenEggs
    if (broken) {
      if (!this.brokenEggs.includes(eggId)) {
        this.brokenEggs.push(eggId);
      }
    } else {
      this.brokenEggs = this.brokenEggs.filter(id => id !== eggId);
    }
    
    this.eggs.set(eggId, egg);
    return egg;
  }

  async getAllEggs(): Promise<EggData[]> {
    return Array.from(this.eggs.values());
  }

  async createCustomLink(linkData: CreateLinkRequest): Promise<LinkResponse> {
    const id = this.currentId++;
    
    // Tạo phần thưởng ngẫu nhiên giữa MIN_REWARD và MAX_REWARD
    const randomReward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1) + MIN_REWARD);
    
    // Kiểm tra dữ liệu đầu vào
    if (!linkData.domain) {
      throw new Error('Domain không được để trống');
    }
    
    // Nếu subdomain là undefined, chuyển thành chuỗi rỗng để tránh lỗi
    const sanitizedSubdomain = linkData.subdomain || '';
    
    const customLink: CustomLink = {
      id,
      userId: 1, // Default to admin user
      domain: linkData.domain,
      subdomain: sanitizedSubdomain,
      path: linkData.path || "",
      active: true,
      eggId: linkData.eggId !== undefined ? linkData.eggId : 0, // Đảm bảo luôn có giá trị mặc định
      reward: randomReward, // Sử dụng phần thưởng ngẫu nhiên 
      used: false, // Mới tạo nên chưa sử dụng
      protocol: linkData.protocol || "https", // Sử dụng protocol từ request hoặc mặc định là https
      createdAt: new Date()
    };

    this.customLinks.set(id, customLink);
    
    // Tạo fullUrl, kiểm tra xem có subdomain không và sử dụng protocol đã chọn
    let fullUrl;
    if (customLink.subdomain) {
      fullUrl = `${customLink.protocol}://${customLink.subdomain}.${customLink.domain}${customLink.path || ''}`;
    } else {
      fullUrl = `${customLink.protocol}://${customLink.domain}${customLink.path || ''}`;
    }

    console.log("Link created:", customLink); // Thêm log để debug

    return {
      id,
      fullUrl,
      subdomain: customLink.subdomain,
      domain: customLink.domain,
      path: customLink.path || '',
      active: customLink.active,
      eggId: customLink.eggId,
      reward: customLink.reward,
      used: customLink.used,
      protocol: customLink.protocol,
      createdAt: customLink.createdAt.toISOString()
    };
  }

  async getCustomLinks(): Promise<LinkResponse[]> {
    return Array.from(this.customLinks.values()).map(link => {
      // Tạo fullUrl, kiểm tra xem có subdomain không và sử dụng protocol được lưu trữ
      let fullUrl;
      if (link.subdomain) {
        fullUrl = `${link.protocol}://${link.subdomain}.${link.domain}${link.path || ''}`;
      } else {
        fullUrl = `${link.protocol}://${link.domain}${link.path || ''}`;
      }
      
      return {
      id: link.id,
        fullUrl,
      subdomain: link.subdomain,
      domain: link.domain,
        path: link.path || '',
      active: link.active,
        eggId: link.eggId,
        reward: link.reward,
        used: link.used,
        protocol: link.protocol || "https",
      createdAt: link.createdAt.toISOString()
      };
    });
  }

  async deleteCustomLink(id: number): Promise<boolean> {
    return this.customLinks.delete(id);
  }

  // Global win rate management methods
  async getGlobalWinRateConfig(): Promise<GlobalWinRateConfig> {
    return { ...this.globalWinRateConfig };
  }

  async updateGlobalWinRateConfig(config: Partial<GlobalWinRateConfig>): Promise<GlobalWinRateConfig> {
    // Validate config
    if (config.globalWinRate !== undefined && (config.globalWinRate < 0 || config.globalWinRate > 100)) {
      throw new Error("Global win rate must be between 0 and 100");
    }

    if (config.groups) {
      if (config.groups.groupA.winRate < 0 || config.groups.groupA.winRate > 100) {
        throw new Error("Group A win rate must be between 0 and 100");
      }
      if (config.groups.groupB.winRate < 0 || config.groups.groupB.winRate > 100) {
        throw new Error("Group B win rate must be between 0 and 100");
      }

      // Validate egg IDs are within valid range
      const invalidIdsA = config.groups.groupA.eggIds.filter(id => id < 1 || id > TOTAL_EGGS);
      if (invalidIdsA.length > 0) {
        throw new Error(`Invalid egg IDs in Group A: ${invalidIdsA.join(', ')}`);
      }

      const invalidIdsB = config.groups.groupB.eggIds.filter(id => id < 1 || id > TOTAL_EGGS);
      if (invalidIdsB.length > 0) {
        throw new Error(`Invalid egg IDs in Group B: ${invalidIdsB.join(', ')}`);
      }

      // Check for duplicate egg IDs between groups
      const duplicateIds = config.groups.groupA.eggIds.filter(id =>
        config.groups!.groupB.eggIds.includes(id)
      );
      if (duplicateIds.length > 0) {
        throw new Error(`Egg IDs cannot be in both groups: ${duplicateIds.join(', ')}`);
      }
    }

    // Update configuration
    this.globalWinRateConfig = {
      ...this.globalWinRateConfig,
      ...config
    };

    console.log(`⚙️ Global Win Rate Config Updated:`, this.globalWinRateConfig);

    return { ...this.globalWinRateConfig };
  }

  // Bulk update all eggs with the same win rate
  async bulkUpdateEggWinRates(winningRate: number): Promise<EggData[]> {
    if (winningRate < 0 || winningRate > 100) {
      throw new Error("Win rate must be between 0 and 100");
    }

    const updatedEggs: EggData[] = [];

    for (let i = 1; i <= TOTAL_EGGS; i++) {
      const egg = this.eggs.get(i);
      if (egg) {
        egg.winningRate = winningRate;
        this.eggs.set(i, egg);
        updatedEggs.push(egg);
      }
    }

    console.log(`⚙️ Bulk Update - All eggs win rate set to ${winningRate}%`);

    return updatedEggs;
  }

  // Bulk update all eggs with the same reward
  async bulkUpdateEggRewards(reward: number | string): Promise<EggData[]> {
    // Validate reward input
    if (typeof reward === 'string' && reward.trim().length === 0) {
      throw new Error("Reward string cannot be empty");
    }
    if (typeof reward === 'number' && reward < 0) {
      throw new Error("Reward number cannot be negative");
    }

    const updatedEggs: EggData[] = [];

    for (let i = 1; i <= TOTAL_EGGS; i++) {
      const egg = this.eggs.get(i);
      if (egg) {
        egg.reward = reward;
        this.eggs.set(i, egg);
        updatedEggs.push(egg);
      }
    }

    console.log(`Bulk updated ${updatedEggs.length} eggs with reward "${reward}"`);
    return updatedEggs;
  }
}

// Tạo và xuất instance của MemStorage thay vì DatabaseStorage
export const storage = new MemStorage();
