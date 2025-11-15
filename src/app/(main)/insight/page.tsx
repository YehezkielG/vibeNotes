'use client'
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function ModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl"
      >
        Open Modal
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 shadow-lg"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Modal Title
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ini contoh modal menggunakan Framer Motion.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Tutup
                
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
