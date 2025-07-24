// Game constants
export const TOTAL_EGGS = 9;
export const MIN_REWARD = 50; // in points
export const MAX_REWARD = 500; // in points

// Game types
export interface GameState {
  deadline: number;
  eggs: EggState[];
  brokenEggs: number[];
  score: number;
  progress: number;
}

export interface EggState {
  id: number;
  broken: boolean;
  reward: number;
}

// Helper functions
export const calculateProgress = (brokenEggs: number[]): number => {
  return (brokenEggs.length / TOTAL_EGGS) * 100;
};

export const generateRandomReward = (): number => {
  return Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1) + MIN_REWARD);
};

export const formatReward = (reward: number | string): string => {
  if (typeof reward === 'string') {
    return reward;
  }
  return `${(reward / 1000).toFixed(2)} K`;
};

// Initial game state generator
export const createInitialGameState = (): GameState => {
  // Set deadline to 24 hours from now
  const deadline = Date.now() + 24 * 60 * 60 * 1000;
  
  // Generate eggs with rewards
  const eggs = Array.from({ length: TOTAL_EGGS }, (_, i) => ({
    id: i + 1,
    broken: false,
    reward: generateRandomReward(),
  }));
  
  return {
    deadline,
    eggs,
    brokenEggs: [],
    score: 0,
    progress: 0,
  };
};
