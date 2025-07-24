import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RewardNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  reward: number | string;
}

// Tạo hiệu ứng confetti
const Confetti = () => {
  // Tạo mảng các phần tử confetti với vị trí và màu sắc ngẫu nhiên
  const confettiElements = Array.from({ length: 50 }).map((_, i) => {
    const size = Math.random() * 10 + 5;
    const colors = ["#FFD700", "#FF5252", "#FFC107", "#FFEB3B", "#2196F3", "#4CAF50"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 1;
    
    // Tạo các hình dạng khác nhau cho confetti
    const shapes = [
      // Hình tròn
      <circle key={`circle-${i}`} cx={size/2} cy={size/2} r={size/2} fill={color} />,
      // Hình tam giác
      <polygon key={`polygon-${i}`} points={`${size/2},0 ${size},${size} 0,${size}`} fill={color} />,
      // Hình vuông
      <rect key={`rect-${i}`} width={size} height={size} fill={color} />,
      // Hình sao
      <polygon key={`star-${i}`} points={`${size/2},0 ${size*0.6},${size*0.4} ${size},${size*0.5} ${size*0.6},${size*0.6} ${size*0.7},${size} ${size/2},${size*0.75} ${size*0.3},${size} ${size*0.4},${size*0.6} 0,${size*0.5} ${size*0.4},${size*0.4}`} fill={color} />
    ];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    return (
      <motion.svg
        key={i}
        style={{ position: 'absolute', left: `${startX}%`, top: "0%", width: size, height: size }}
        initial={{ y: "0%", rotate: 0, opacity: 1 }}
        animate={{ 
          y: "100vh", 
          rotate: Math.random() * 720 - 360,
          x: [
            0, 
            Math.random() * 200 - 100, 
            Math.random() * 200 - 100, 
            Math.random() * 200 - 100
          ],
          opacity: [1, 1, 0]
        }}
        transition={{ 
          duration, 
          delay, 
          ease: "easeOut",
          times: [0, 0.8, 1],
          repeat: Infinity,
          repeatDelay: Math.random() * 2
        }}
      >
        {shape}
      </motion.svg>
    );
  });
  
  return <div className="confetti-container absolute inset-0 overflow-hidden pointer-events-none">{confettiElements}</div>;
};

const RewardNotification = ({ isOpen, onClose, reward }: RewardNotificationProps) => {
  // Thêm state để kiểm soát hiệu ứng lấp lánh
  const [sparkleIndex, setSparkleIndex] = useState(0);
  
  // Tạo hiệu ứng lấp lánh theo thời gian
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setSparkleIndex(prev => (prev + 1) % 5);
    }, 300);
    
    return () => clearInterval(interval);
  }, [isOpen]);
  
  // Hiệu ứng lấp lánh
  const sparklePositions = [
    { top: '10%', left: '10%' },
    { top: '20%', right: '15%' },
    { top: '50%', left: '5%' },
    { top: '70%', right: '12%' },
    { top: '85%', left: '20%' },
  ];
  
  // FIX: Format reward to handle both strings and numbers
  const formattedReward = typeof reward === 'string'
    ? reward
    : reward.toFixed(2);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti animation */}
          <Confetti />
          
          {/* Popup card - style giấy cũ với viền đỏ */}
          <motion.div 
            className="notification-popup rounded-xl px-6 py-5 max-w-xs w-full text-center relative overflow-hidden"
            initial={{ scale: 0, opacity: 0, rotateX: 90 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0, opacity: 0, rotateX: -45 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              duration: 0.5 
            }}
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px 5px rgba(211, 47, 47, 0.15)',
              backgroundColor: '#f9f2e3',
              border: '1px solid #d32f2f',
              backgroundImage: 'linear-gradient(to bottom, #f9f2e3, #f3e8d4)',
            }}
          >
            {/* Hiệu ứng ánh sáng xung quanh */}
            <div className="absolute inset-0 overflow-hidden" style={{ zIndex: -1 }}>
              <motion.div 
                className="w-full h-full bg-[#d32f2f] opacity-5 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                  position: 'absolute',
                  width: '120%',
                  height: '120%'
                }}
              />
            </div>
            
            {/* Nút đóng */}
            <motion.button
              className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white z-20"
              whileHover={{ scale: 1.1, boxShadow: '0 0 8px 2px rgba(211, 47, 47, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              ✕
            </motion.button>
            
            {/* Pattern trang trí trên nền giấy */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                  <circle id="pattern-circle" cx="10" cy="10" r="1.6257413380501518" fill="#d32f2f"></circle>
                </pattern>
                <rect id="rect" x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
              </svg>
            </div>
            
            {/* Mẫu hoa văn trang trí ở các góc */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L100,0 L100,100 C70,90 50,70 30,30 C20,10 10,0 0,0 Z" fill="#d32f2f" />
              </svg>
            </div>
            
            <div className="absolute bottom-0 left-0 w-20 h-20 opacity-10 rotate-180">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 L100,0 L100,100 C70,90 50,70 30,30 C20,10 10,0 0,0 Z" fill="#d32f2f" />
              </svg>
              </div>
              
            {/* Hiệu ứng trang trí phong bì và giấy */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-[#d32f2f] opacity-10 rounded-full"></div>
            <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-[#d32f2f] opacity-20"></div>
            
            <div className="flex flex-col items-center relative z-10">
              {/* Envelope icon ở góc trên phải */}
              <motion.div
                className="absolute -top-3 -right-3 w-10 h-10"
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2" className="w-full h-full">
                  <path d="M22 12.999V7C22 5.93913 21.5786 4.92172 20.8284 4.17157C20.0783 3.42143 19.0609 3 18 3H6C4.93913 3 3.92172 3.42143 3.17157 4.17157C2.42143 4.92172 2 5.93913 2 7V17C2 18.0609 2.42143 19.0783 3.17157 19.8284C3.92172 20.5786 4.93913 21 6 21H11.999M21.999 16L16.5 20.5L13 17" />
                  <path d="M2 7L12 14L22 7" />
                </svg>
              </motion.div>
              
              {/* Tia sáng trang trí */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={`ray-${i}`}
                    className="absolute bg-[#d32f2f] opacity-20"
                    style={{
                      height: '1px',
                      width: '80px',
                      left: '50%',
                      top: '50%',
                      transformOrigin: 'left center',
                      transform: `rotate(${i * 45}deg) translateY(-50%)`,
                    }}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
              
              {/* Tiêu đề "Wooo, chúc mừng bạn" */}
              <h3 className="text-[#d32f2f] font-bold text-xl mb-1 relative">
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative inline-block"
                >
                  Wooo, chúc mừng bạn
                  {/* Đường gạch chân trang trí */}
                  <motion.div 
                    className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#d32f2f] to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  />
                </motion.span>
              </h3>
              
              {/* Phần thưởng chính */}
              <motion.div 
                className="w-full bg-transparent px-2 py-3 mb-2 relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* Hiệu ứng bóng đỏ sau phần thưởng */}
                <motion.div 
                  className="absolute inset-0 bg-[#d32f2f] opacity-5 rounded-lg blur-md"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                <div className="flex flex-col items-center">
                  {/* Label "Trúng Thưởng" */}
                  <p className="text-[#7a5c3d] font-medium text-base mb-1 relative">
                    Trúng Thưởng
                    {/* Hoa văn trang trí */}
                    <span className="absolute -left-4 -top-1 text-lg opacity-50">✦</span>
                    <span className="absolute -right-4 -top-1 text-lg opacity-50">✦</span>
                  </p>
                  
                  {/* Số tiền thưởng */}
                  <div className="relative">
                    {/* Hiệu ứng ánh sáng cho số tiền */}
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-[#d32f2f] blur-md opacity-0"
                      animate={{ 
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    
                    <motion.div
                      className="text-[#d32f2f] text-3xl font-bold relative"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        textShadow: [
                          "0 0 0px rgba(211, 47, 47, 0.3)",
                          "0 0 4px rgba(211, 47, 47, 0.5)",
                          "0 0 0px rgba(211, 47, 47, 0.3)"
                        ]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      style={{
                        WebkitTextStroke: '0.5px rgba(211, 47, 47, 0.2)',
                      }}
                    >
                      {formattedReward}
                      
                      {/* Lấp lánh xung quanh số tiền */}
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={`sparkle-${i}`}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          style={{
                            left: `${i * 20}%`,
                            top: `${i % 2 ? 0 : 100}%`,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
              </div>
              </motion.div>
              
              {/* Trang trí xu ở dưới với hiệu ứng lấp lánh */}
              <div className="flex justify-center space-x-3 mt-1">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-[#f5d76e] to-[#e6b422] rounded-full border-2 border-[#e6b422] flex items-center justify-center text-[#7d6608] font-bold text-xs shadow-md relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1,
                      y: 0,
                      rotateY: [0, 180, 360],
                    }}
                    transition={{ 
                      opacity: { delay: 0.4 + (i * 0.1), duration: 0.5 },
                      y: { delay: 0.4 + (i * 0.1), duration: 0.5 },
                      rotateY: { delay: 0.6 + (i * 0.1), duration: 1.5 }
                    }}
                    style={{
                      boxShadow: '0 2px 6px rgba(230, 180, 34, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {/* Hiệu ứng lấp lánh */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                      animate={{
                        opacity: [0, 0.6, 0],
                        left: ['-100%', '100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3 + 1,
                        repeatDelay: 2,
                      }}
                    />
                    ¥
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardNotification;
