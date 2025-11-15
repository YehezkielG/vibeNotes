"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { inputValidator } from "@/lib/utils/validator";

const { Email: validateEmail, Age: validateAge } = new inputValidator();

export default function Form() {
  const [authenticated,setAuthenticated ] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authenticated) {
      router.push("/register/verified");
    }
  }, [authenticated, router]);

  if (authenticated) return null;
  return <AuthForm setAuthenticated={setAuthenticated}/>;
}

interface errMessageInterface {
  email: string | null;
  age: string | null;
}

function AuthForm({ setAuthenticated }: { setAuthenticated: (value: boolean) => void }) { 
    const [email, setEmail] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [errMessage, setErrMessage] = useState<errMessageInterface>({
      email: null,
      age: null,
    });
  
    
    async function handleSubmit() {
      setErrMessage({ email: validateEmail(email), age: validateAge(birthDate) });
      if (!validateEmail(email) && !validateAge(birthDate)) {
        setAuthenticated(true);
      }
    }

    return (
      <motion.div
        className="w-full max-w-md p-8"
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
        <form>
          <div className="mb-6">
            <label
              htmlFor="birthdate"
              className="block text-sm font-medium text-gray-400"
            >
              Birth Date
            </label>
            <div className="flex space-x-2">
              <motion.input
                type="date"
                id="birthdate"
                placeholder="enter verification code"
                className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800/5 px-4 py-2 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setBirthDate(e.target.value)}
                value={birthDate}
                whileFocus={{ scale: 1.01 }}
              />
            </div>
            {errMessage.age && (
              <p className="text-sm text-red-400">{
                errMessage.age
              }</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400"
            >
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
              whileFocus={{ scale: 1.01 }}
            />
            {errMessage.email && (
              <p className="text-sm text-red-400">{errMessage.email}</p>
            )}
          </div>
          {/* <Link href="/register/verified"> */}
            <motion.button
              className="w-full rounded-md bg-indigo-600 py-3 font-semibold text-white text-center transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              type="button"
            >
              Verify & Continue
            </motion.button>
        </form>
      </motion.div>
    );
}