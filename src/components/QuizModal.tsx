import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { QuizFunnel } from './QuizFunnel';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen sheet that stays usable inside in-app browsers (Instagram / Facebook / TikTok):
 * - the overlay itself scrolls (not a nested 90vh box), so the submit button is always reachable
 *   even with the in-app bottom bar and the iOS keyboard open;
 * - safe-area padding for notched phones;
 * - locks page scroll behind it so touch-scrolling moves the form, not the page.
 */
export function QuizModal({ isOpen, onClose }: QuizModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-black/95 md:backdrop-blur-xl"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="fixed top-4 right-4 md:top-10 md:right-10 text-white/70 hover:text-white transition-colors z-[130] bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div className="min-h-full flex items-start md:items-center justify-center pt-12 md:pt-0">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl rounded-[2rem]"
            >
              <QuizFunnel />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
