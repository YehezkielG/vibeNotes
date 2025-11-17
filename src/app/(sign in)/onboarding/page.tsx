"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mars, Venus, CircleHelp as CircleQuestionMark } from "lucide-react";
import { redirect } from "next/navigation";
import type { IUser } from "@/models/User";

// This is your "Edit Profile" page at /profile/me
// It is displayed INSIDE the main layout (with Sidebar)

// NEW: GenderInput component
function GenderInput({ setGender }: { setGender: (value: string) => void }) {
  type Gender = "male" | "female" | "prefer_not_to_say";
  const options: {
    key: Gender;
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    iconClass: string;
  }[] = [
    { key: "male", label: "Male", Icon: Mars, iconClass: "text-sky-500" },
    { key: "female", label: "Female", Icon: Venus, iconClass: "text-pink-500" },
    {
      key: "prefer_not_to_say",
      label: "Prefer not to say",
      Icon: CircleQuestionMark,
      iconClass: "text-violet-500",
    },
  ];

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Gender
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map(({ key, label, Icon, iconClass }) => (
          <label key={key} className="cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={key}
              className="hidden peer"
              onChange={() => setGender(key)}
              required
            />
            <motion.div
              className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-200 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={18} className={iconClass} />
              <span className="font-medium text-gray-700 peer-checked:text-indigo-600">
                {label}
              </span>
            </motion.div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  // Only users who are already onboarded can access this page
  const { data: session, status } = useSession();

  // Initialize state with data from the session
  const [displayName, setDisplayName] = useState(session?.user?.name || session?.user?.displayName || "");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [errInput, setErrInput] = useState<{
    username?: string;
    displayName?: string;
    gender?: string;
    bio?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  // Effect to populate form once session loads
  useEffect(() => {
    if (
      session?.user &&
      typeof (session.user as IUser).isOnboarded !== "undefined" &&
      (session.user as IUser).isOnboarded
    ) {
      redirect("/");
    }
  }, [session]);

  useEffect(() => {
    console.log(loading);
  }, [loading]);

  // Profile submit handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, displayName, gender, bio }),
    });
    const data = await res.json();
    if (res.status !== 200) {
      setErrInput(data.errInput);
    }else{
      redirect("/");
    }
    if (res) {
      setLoading(false);
    }
  }
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="inline-block h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated" || !session) {
    redirect("/auth");
  }

  return (
    <motion.div
      className="w-full max-w-md p-8 "
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center mb-6">
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt="Profile Picture"
            width={75}
            height={75}
            className="rounded-full mb-2"
          />
        )}
        <h2 className="text-center text-xl font-bold text-gray-800">
          Complete Your Profile
        </h2>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-5">
        {/* Email (readonly) */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-gray-500"
          >
            Email (cannot be changed)
          </label>
          <input
            id="email"
            type="email"
            value={session?.user?.email || ""}
            disabled
            className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
          />
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-xs font-medium text-gray-600"
          >
            Display Name
          </label>
          <motion.input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-800 transition-all duration-200 border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            whileFocus={{ scale: 1.01 }}
          />
          <p className="text-xs text-red-500">
            {errInput.displayName}
          </p>
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-medium text-gray-600"
          >
            Username
          </label>
          <motion.input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-800 transition-all duration-200 border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            whileFocus={{ scale: 1.01 }}
          />
          <p className="text-xs text-red-500">
            {errInput.username}
          </p>
        </div>
        <div className="">
        <div className="">
          {/* REPLACED: old <select> gender block with new component */}
          <GenderInput setGender={setGender} />
          <p className="text-xs text-red-500">
            {errInput.gender}
          </p>
        </div>
        {/* Bio (optional) */}
        <div>
          <label
            htmlFor="bio"
            className="block text-xs font-medium text-gray-600"
          >
            Bio <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-800 transition-all duration-200 border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
            placeholder="Tell us a little about yourself..."
          />
          <p className="text-xs text-red-500">
            {errInput.bio}
          </p>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-500 mt-2 cursor-pointer w-full px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
          onClick={handleProfileSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
                  {loading ? (
          <motion.span
            className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ display: "inline-block" }}
          />
        ) : (
          "Save Changes"
        )}
        </motion.button>
      </div>
      </form>
    </motion.div>
  );
}