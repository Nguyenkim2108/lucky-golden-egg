import { motion } from "framer-motion";
import { LeaderboardEntry } from "@shared/schema";

interface LeaderboardSectionProps {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
}

const LeaderboardSection = ({ leaderboard, isLoading }: LeaderboardSectionProps) => {
  // Placeholder data for loading state
  const placeholderData = Array(3).fill(null).map((_, i) => ({
    id: i +
    1,
    username: `${i + 1}${getOrdinalSuffix(i + 1)}********`,
    score: 0,
  }));

  // Get top 3 users from leaderboard or use placeholder data
  const topUsers = isLoading ? placeholderData : leaderboard.slice(0, 3);

  // Format score to K format
  const formatScore = (score: number) => {
    return `${(score / 1000).toFixed(2)} K`;
  };

};

// Helper function to get ordinal suffix
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

export default LeaderboardSection;
