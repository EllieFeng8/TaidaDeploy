import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export function Toast({ isVisible, title, message, type = 'success', onClose }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="toast-notification"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-[100]"
        >
          <div className="bg-white shadow-xl border-l-4 border-emerald-500 p-4 min-w-[320px] rounded-lg flex items-center gap-4 border border-slate-100">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
              {type === 'success' ? (
                <CheckCircle className="text-emerald-500 w-6 h-6" />
              ) : (
                <XCircle className="text-rose-500 w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-bold text-slate-800 truncate">{title}</p>
              <p className="font-sans text-xs text-slate-500 truncate">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-slate-50"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
