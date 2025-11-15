"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from 'next/image'

export default function Form() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    return;
  };

  return (
      <motion.div
        className="w-full max-w-md p-8 g"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Image src="/logo.png" alt="Logo" width={75} height={75} className="mx-auto mb-4" />
        <h2 className="mb-4 text-center text-xl text-gray-800 font-bold">vibeNotes</h2>       
        <form onSubmit={handleSubmit}>
          <div className="mb-4 bg-blu">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email address
            </label>
            <motion.input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800/5 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              whileFocus={{ scale: 1.0 }}
            />
          </div>

          <motion.button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </motion.button>
          <div className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 transition-colors duration-200 hover:text-indigo-300 hover:underline">
              Register 
            </Link>
          </div>
        </form>
      </motion.div>
  );
}