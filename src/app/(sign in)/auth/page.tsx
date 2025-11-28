"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { validateEmail } from "@/lib/utils/validator";
import { useSession, signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import AuthSkeleton from "@/components/skeletons/AuthSkeleton";


export default function Form() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const session = useSession();
  if (session.status === "authenticated") {
    redirect("/");
  } else if (session.status === "loading") {
    return <AuthSkeleton />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    const res = await signIn("resend", { email, redirect: false });
    setIsLoading(false);
    if (res?.error) {
      setError("Failed to send sign-in link. Try again.");
    } else {
      setSuccess("Check your email for the sign-in link!");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    await signIn("Discord", { callbackUrl: "/" });
    setIsLoading(false);
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
      <h2 className="text-center text-xl text-gray-800 font-bold mb-10">vibeNotes</h2>
      
      {/* OAuth Buttons on Top */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        disabled={isLoading}
      >
        <Image src="/img/auth/google.png" alt="Google" width={20} height={20} />
        Continue with Google
      </motion.button>

      <motion.button
        type="button"
        onClick={handleDiscordSignIn}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        disabled={isLoading}
      >
        <Image src="/img/auth/Discord.png" alt="Discord" width={20} height={20} />
        Continue with Discord
      </motion.button>

      <div className="my-6 flex items-center">
        <div className="grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-400 text-xs">or</span>
        <div className="grow border-t border-gray-300"></div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-400">
            Email address
          </label>
          <motion.input
            type="email"
            id="email"
            placeholder="you@example.com"
            className={`mt-1 w-full rounded-md border px-4 py-2 text-gray-800 transition-all duration-200
              ${inputFocus ? "border-indigo-500 ring-2 ring-indigo-200 bg-white" : "border-gray-700 bg-gray-800/5"}
              ${error ? "border-red-500 ring-2 ring-red-200" : ""}
            `}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setInputFocus(true)} 
            onBlur={() => setInputFocus(false)}
            required
            whileFocus={{ scale: 1.01 }}
          />
          <AnimatePresence>
            {error && (
              <motion.div
                className="text-xs text-red-500 mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                className="text-xs text-green-600 mt-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="submit"
          className="w-full rounded-md bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <motion.span
              className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-label="Loading"
            />
          ) : (
            'Continue with Email'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}