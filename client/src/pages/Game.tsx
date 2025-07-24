import React, {
  useEffect,
  useState,
} from 'react';

import { motion } from 'framer-motion';
import { useParams } from 'wouter';

import CountdownTimer from '@/components/CountdownTimer';
import EggGrid from '@/components/EggGrid';
import RewardNotification from '@/components/RewardNotification';
import {
  apiRequest,
  queryClient,
} from '@/lib/queryClient';
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query';

// Define GameState interface locally
interface GameState {
  deadline?: number;
  brokenEggs?: number[];
  progress?: number;
  linkId?: number;
  linkUsed?: boolean;
  eggs?: Array<{
    id: number;
    broken: boolean;
    reward: number | string;
  }>;
}

const Game = () => {
  // Game state
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<number | string>(0);
  const [progress, setProgress] = useState(0);
  const [brokenEggs, setBrokenEggs] = useState<number[]>([]);
  const [eggRewards, setEggRewards] = useState<{[key: number]: number | string}>({});
  const [allEggsRevealed, setAllEggsRevealed] = useState(false);
  
  // Lấy customPath từ params nếu có
  const params = useParams();
  const customPath = params.customPath;
  
  // Lấy linkId từ query params nếu có
  const urlSearchParams = new URLSearchParams(window.location.search);
  const linkId = parseInt(urlSearchParams.get('linkId') || '0', 10);

  // Fetch game state from server with linkId
  const { data: gameData, isLoading: gameLoading } = useQuery<GameState>({
    queryKey: ["/api/game-state", linkId],
    queryFn: async () => {
      const response = await fetch(`/api/game-state${linkId ? `?linkId=${linkId}` : ''}`);
      return response.json();
    }
  });
  
  // Nếu có customPath nhưng không có linkId, tìm linkId từ server
  useEffect(() => {
    if (customPath && !linkId) {
      // Tìm linkId từ customPath
      const findLinkId = async () => {
        try {
          const response = await fetch(`/api/find-link-by-path?path=${customPath}`);
          if (response.ok) {
            const data = await response.json();
            if (data.linkId) {
              // Chuyển hướng đến URL với linkId
              window.location.href = `/${customPath}?linkId=${data.linkId}`;
            }
          }
        } catch (error) {
          console.error("Error finding link by path:", error);
        }
      };
      
      findLinkId();
    }
  }, [customPath, linkId]);

  // Break egg mutation
  const { mutate: breakEgg } = useMutation({
    mutationFn: async (eggId: number) => {
      // Gửi kèm linkId nếu có
      const response = await apiRequest("POST", "/api/break-egg", { 
        eggId, 
        linkId: linkId || undefined 
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("🎯 Break egg API response:", data);

      // FIX: Since we disabled "reveal all eggs", API now always returns BreakEggResult
      // Handle both custom links and regular game the same way
      console.log("🎯 Processing BreakEggResult:", data);

      // Cập nhật trạng thái trứng vỡ - chỉ trứng được click
      setBrokenEggs(prev => {
        if (prev.includes(data.eggId)) {
          return prev; // Already broken, don't add again
        }
        return [...prev, data.eggId];
      });
      console.log("🥚 Adding to brokenEggs:", data.eggId);

      // FIX: Display the actual reward (string or number) instead of converting to 0
      setCurrentReward(data.reward);
      setShowReward(true);
      console.log("🎁 Setting currentReward:", data.reward);

      // Cập nhật phần thưởng cho trứng này
      setEggRewards(prev => ({
        ...prev,
        [data.eggId]: data.reward
      }));
      console.log("💰 Adding to eggRewards:", { [data.eggId]: data.reward });

      // FIX: Don't mark all eggs as revealed for custom links
      // Only the clicked egg should be broken, others remain intact
      if (linkId) {
        console.log("🔍 Custom link used - only clicked egg should break");
        // Don't set allEggsRevealed to true - this was causing multiple eggs to appear broken
      }

      // Cập nhật progress (chỉ cho chế độ thông thường)
      if (!linkId) {
        const newProgress = (brokenEggs.length + 1) / 8 * 100; // Changed from 9 to 8 eggs
        setProgress(newProgress);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state", linkId] });
    },
  });

  // Claim rewards mutation (không cần trong chế độ link)
  const { mutate: claimRewards } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/claim-rewards", {});
      return response.json();
    },
    onSuccess: () => {
      // Reset broken eggs and progress
      setBrokenEggs([]);
      setProgress(0);
      setEggRewards({});
      setAllEggsRevealed(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/game-state", linkId] });
    },
  });

  // Handle egg click
  const handleEggClick = (eggId: number) => {
    // FIX: For custom links, only allow one egg to be broken
    if (linkId) {
      // Kiểm tra xem link đã được sử dụng chưa
      if (gameData?.linkUsed) {
        alert("Link này đã được sử dụng. Vui lòng sử dụng link khác.");
        return;
      }

      // Kiểm tra xem đã có trứng nào bị vỡ chưa (chỉ cho phép 1 trứng)
      if (brokenEggs.length > 0) {
        alert("Bạn chỉ được đập một quả trứng duy nhất. Vui lòng sử dụng link khác để đập trứng khác.");
        return;
      }

      // Cho phép đập trứng được click
      breakEgg(eggId);
    } else {
      // Chế độ thông thường - cho phép đập nhiều trứng
      if (!brokenEggs.includes(eggId)) {
        breakEgg(eggId);
      }
    }
  };

  // Handle claim button click - Break random egg or claim rewards
  const handleClaimClick = () => {
    if (linkId) {
      // Trong chế độ link, nút này chỉ dùng để refresh
      window.location.reload();
      return;
    }
    
    // Get available (non-broken) eggs
    const availableEggs = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(id => !brokenEggs.includes(id));
    
    // If all eggs are broken, claim rewards instead
    if (availableEggs.length === 0) {
      claimRewards();
      return;
    }
    
    // Choose a random egg from available eggs
    const randomIndex = Math.floor(Math.random() * availableEggs.length);
    const randomEggId = availableEggs[randomIndex];
    
    // Break the selected egg
    breakEgg(randomEggId);
  };

  // Calculate time remaining
  const deadline = gameData?.deadline || Date.now() + 24 * 60 * 60 * 1000; // Default 24h from now
  
  // Update UI when game state changes
  useEffect(() => {
    if (gameData) {
      setBrokenEggs(gameData.brokenEggs || []);
      setProgress(gameData.progress || 0);

      // FIX: For custom links, don't set allEggsRevealed to true
      // This was causing all eggs to appear broken when only one should be
      if (gameData.linkId && gameData.linkUsed) {
        // Don't set allEggsRevealed for custom links - only individual eggs should show as broken
        // setAllEggsRevealed(true); // REMOVED - this was the bug

        // Only set rewards for actually broken eggs, not all eggs
        if (gameData.eggs && gameData.eggs.length > 0) {
          const rewards: {[key: number]: number | string} = {};
          gameData.eggs.forEach(egg => {
            // Only add rewards for eggs that are actually broken
            if (egg.broken) {
              rewards[egg.id] = egg.reward;
            }
          });
          setEggRewards(rewards);
        }
      }
    }
  }, [gameData, linkId]);
  
  // Game background
  const gameBackground = "bg-gradient-to-b from-blue-900 to-blue-950";

  return (
    <div className="relative min-h-screen bg-[hsl(var(--blue-dark))] overflow-y-auto"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 215, 0, 0.5) rgba(0, 0, 128, 0.2)'
      }}>
        <div className={`${gameBackground} fixed inset-0 opacity-40`}></div>
        
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col p-4 z-10">
          {/* Game Title */}
          <div className="text-center mb-2 mt-4">
            
            <h1 className="text-white font-bold text-xl mt-1">ĐẬP VỠ TRỨNG VÀNG</h1>
          </div>
        
        {/* Link Info - hiển thị khi sử dụng link */}
        {linkId > 0 && (
          <div className="mb-3 p-2 bg-[hsl(var(--red-primary))]/20 rounded-lg text-center">
            <span className="text-white text-sm">
              {gameData?.linkUsed || brokenEggs.length > 0
                ? "Link này đã được sử dụng. Chỉ có thể xem phần thưởng."
                : `Bạn chỉ được đập 1 quả trứng duy nhất.`}
            </span>
          </div>
        )}
          
          {/* Countdown Timer */}
          <CountdownTimer deadline={deadline} />
          
          {/* Egg Grid */}
          <EggGrid
            brokenEggs={brokenEggs}
            onEggClick={handleEggClick}
          eggRewards={eggRewards}
          allEggsRevealed={allEggsRevealed}
          allowedEggId={undefined} // Không cần đánh dấu quả trứng nào được phép đập nữa
          linkId={linkId} // NEW: Pass linkId to determine custom link mode
          />
          
        {/* Claim/Reset Button And Progress Bar */}
          <div className="mt-auto mb-2">
          {/* Claim button - đổi thành "Thử lại" khi sử dụng link */}
            <motion.button 
              className="w-full bg-gradient-to-r from-[hsl(var(--gold-secondary))] to-[hsl(var(--gold-primary))] text-white font-bold py-2.5 rounded-lg shadow-md mb-3"
              whileTap={{ scale: 0.95 }}
              onClick={handleClaimClick}
            >
            {linkId ? "Thử lại" : "Nhận ngay"}
            </motion.button>
            
          {/* Progress bar - chỉ hiển thị khi không sử dụng link */}
          {!linkId && (
            <>
            <div className="relative h-2 bg-gray-300 rounded-full mb-2 overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-[hsl(var(--gold-primary))] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
            
            {/* Progress percentage */}
            <div className="text-right text-xs text-white/80 mb-2">
              <span>{progress.toFixed(2)}%</span>
            </div>
            </>
          )}
          </div>
      </div>
      
      {/* Reward Notification */}
      <RewardNotification 
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        reward={currentReward}
      />
    </div>
  );
};

export default Game;
