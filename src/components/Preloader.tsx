import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: Eye draws in (0-1.5s)
    // Phase 1: Eye fades out, Box draws in (1.5s-3.0s)
    // Phase 2: Box fades out, Home draws in (3.0s-4.5s)
    // Phase 3: Home fills, then loader fades out (4.5s-5.5s)
    
    const t1 = setTimeout(() => setPhase(1), 1500);
    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => setPhase(3), 4500);
    const t4 = setTimeout(() => onComplete(), 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Subtle architectural grid background */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 2 }}
        style={{
          backgroundImage: `
            linear-gradient(to right, #333 1px, transparent 1px),
            linear-gradient(to bottom, #333 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative w-48 h-48 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.svg
              key="eye"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-32 h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <motion.path 
                d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 1, ease: "easeInOut" }} 
              />
              <motion.circle 
                cx="12" cy="12" r="3" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }} 
              />
            </motion.svg>
          )}

          {phase === 1 && (
            <motion.svg
              key="box"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-32 h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              {/* Architectural floor plan box */}
              <motion.rect 
                x="3" y="3" width="18" height="18" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 1, ease: "easeInOut" }} 
              />
              <motion.line 
                x1="3" y1="9" x2="21" y2="9" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }} 
              />
              <motion.line 
                x1="9" y1="3" x2="9" y2="21" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 0.6, delay: 0.6 }} 
              />
            </motion.svg>
          )}

          {(phase === 2 || phase === 3) && (
            <motion.svg
              key="home"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={phase === 3 ? "white" : "none"}
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-32 h-32 drop-shadow-[0_0_25px_rgba(255,255,255,1)]"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                fill: phase === 3 ? "white" : "none"
              }}
              exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Modern Home Silhouette */}
              <motion.path 
                d="M3 10l9-8 9 8v11H3V10z" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 1, ease: "easeInOut" }} 
              />
              <motion.path 
                d="M9 21v-8h6v8" 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 0.8, delay: 0.4 }} 
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      
      {/* Loading text */}
      <motion.div 
        className="absolute bottom-12 text-white/50 font-mono text-xs tracking-[0.3em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {phase === 0 && "Initializing Vision"}
        {phase === 1 && "Drafting Structure"}
        {phase >= 2 && "Building Reality"}
      </motion.div>
    </motion.div>
  );
}
