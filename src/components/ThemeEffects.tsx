import React from 'react';
import { motion } from 'motion/react';

interface ThemeEffectsProps {
  theme: 'default' | 'sakura' | 'cookie' | 'panda' | 'capybara';
}

const ThemeEffects: React.FC<ThemeEffectsProps> = ({ theme }) => {
  if (theme === 'default') return null;

  const getThemeConfig = () => {
    switch (theme) {
      case 'sakura':
        return {
          icons: ['🌸', '💮', '🩷'],
          count: 15,
          color: 'text-pink-300',
        };
      case 'cookie':
        return {
          icons: ['🍪', '🥛', '✨'],
          count: 12,
          color: 'text-amber-800',
        };
      case 'panda':
        return {
          icons: ['🐼', '🎋', '🌿'],
          count: 10,
          color: 'text-emerald-800',
        };
      case 'capybara':
        return {
          icons: ['🦦', '🍊', '💧'],
          count: 10,
          color: 'text-orange-800',
        };
      default:
        return { icons: [], count: 0, color: '' };
    }
  };

  const config = getThemeConfig();
  const elements = Array.from({ length: config.count }).map((_, i) => ({
    id: i,
    icon: config.icons[i % config.icons.length],
    left: Math.random() * 100,
    topOffset: Math.random() * -20,
    duration: 10 + Math.random() * 10,
    delay: Math.random() * 5,
    scale: 0.5 + Math.random() * 1,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className={`absolute ${config.color} opacity-30 select-none`}
          initial={{
            top: `${el.topOffset}vh`,
            left: `${el.left}vw`,
            scale: el.scale,
            rotate: el.rotation,
          }}
          animate={{
            top: '110vh',
            rotate: el.rotation + 360,
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: el.delay,
          }}
        >
          <span className="text-3xl filter drop-shadow-sm">{el.icon}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default ThemeEffects;
