import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { QuizFunnel } from './QuizFunnel';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuizModal({ isOpen, onClose }: QuizModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-10 md:right-10 text-white/70 hover:text-white transition-colors z-[130] bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2rem]"
          >
            <QuizFunnel />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
