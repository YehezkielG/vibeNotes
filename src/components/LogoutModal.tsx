"use client";

import { motion, AnimatePresence } from "framer-motion";

type LogoutModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  avatar?: string;
  username?: string;
};

export default function LogoutModal({ open, onClose, onConfirm, avatar, username }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center p-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            className="relative z-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt={username ?? "avatar"} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              )}
              <div>
                <h3 className="text-lg font-semibold">Log out</h3>
                <p className="mt-0.5 text-sm text-gray-600">Are you sure you want to log out?</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
