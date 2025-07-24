import { motion } from "framer-motion";

const FooterNavigation = () => {
  const navItems = [
    { icon: "🏠", label: "Trang chủ" },
    { icon: "🎮", label: "Trò chơi" },
    { icon: "👑", label: "VIP" },
    { icon: "👤", label: "Tài khoản" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-20">
      {navItems.map((item, index) => (
        <motion.button
          key={index}
          className="flex flex-col items-center justify-center w-16"
          whileTap={{ scale: 0.9 }}
        >
          <div className="text-gray-600 text-xl">{item.icon}</div>
          <span className="text-xs text-gray-600">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default FooterNavigation;
