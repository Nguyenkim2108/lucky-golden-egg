import { motion } from "framer-motion";

const GameHeader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-10">
      <div className="relative flex items-center justify-center h-16 bg-gradient-to-b from-[hsl(var(--blue-dark))]/90 to-[hsl(var(--blue-dark))]/70 backdrop-blur">
        <div className="absolute left-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[hsl(var(--gold-primary))]">
            {/* Profile icon placeholder */}
            <div className="w-full h-full bg-[hsl(var(--blue-dark))] flex items-center justify-center text-white">
              <span>HD</span>
            </div>
          </div>
        </div>
        
        <div className="relative flex flex-col items-center">
          {/* Reward Banner */}
          <div className="relative">
            {/* Crown icon */}
            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 w-7.5 h-5">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M12 1L15.5 8L22 9.5L17 14.5L18 21L12 18L6 21L7 14.5L2 9.5L8.5 8L12 1Z" fill="#FFD700" />
              </svg>
            </div>
            
            {/* Reward banner with text */}
            <motion.div 
              className="relative h-10 min-w-32 bg-[hsl(var(--red-primary))] px-4 py-1 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--red-primary))] to-[hsl(var(--red-secondary))] rounded-xl"></div>
              <div className="relative z-10 text-white font-bold text-sm">Phần thưởng</div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute right-3">
          <button className="w-8 h-8 rounded-full bg-[hsl(var(--blue-dark))]/50 flex items-center justify-center">
            <span className="text-white text-xl">&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
