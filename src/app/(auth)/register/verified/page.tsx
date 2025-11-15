"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { inputValidator } from "@/lib/utils/validator";
import { Mars, Venus, CircleQuestionMark } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const validator = new inputValidator();

function GenderInput({ setGender }: { setGender: (value: string) => void }) {
  type Gender = "male" | "female" | "prefer_not_to_say";

  const options: {
    key: Gender;
    label: string;
    Icon: React.ComponentType<({size: number})>;
    iconClass: string;
  }[] = [
    { key: "male", label: "Male", Icon: Mars, iconClass: "text-sky-400" },
    { key: "female", label: "Female", Icon: Venus, iconClass: "text-pink-400" },
    {
      key: "prefer_not_to_say",
      label: "Prefer not to say",
      Icon: CircleQuestionMark,
      iconClass: "text-violet-400",
    },
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Gender
      </label>
      <div className="flex space-x-4">
        {options.map(({ key, label, Icon, iconClass }) => {
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center space-x-2"
            >
              <input
                type="radio"
                name="gender"
                value={key}
                className="hidden peer"
                onChange={() => setGender(key)}
                required
              />
              <motion.div
                className={`flex items-center justify-center p-1 rounded-md border-2 peer-checked:bg-gray-300 ${iconClass}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={20}/>
              <span className="text-gray-800 text-sm peer-checked:text-indigo-500 ml-1 font-semibold">
                {label}
              </span>
              </motion.div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function Form() {
  const router = useRouter();

  interface errMessageInterface {
      name: string | null;
      username: string | null;
      displayName: string | null;
      gender: string | null;
  }

  const [errors, setErrors] = useState<errMessageInterface>({
      name: null,
      username: null,
      displayName: null,
      gender: null,
  });

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState<string | null>(null);


  const handleSubmit = async () => {
    setErrors({
      name: validator.displayName(name),
      username: validator.username(username),
      displayName: validator.displayName(name),
      gender: gender ? null : "Please select a gender.",
    });
    if (
      !validator.displayName(name) &&
      !validator.username(username) &&
      gender
    ) {
      setIsLoading(true);
      // Simulate an API call
      router.push("/");
    }
  };

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
        <div className="mb-4 bg-blu">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-400"
          >
            Username
          </label>
          <motion.input
            type="text"
            id="username"
            placeholder="enter your username"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800/5 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            whileFocus={{ scale: 1.0 }}
          />
          {errors.username && errors.username && (
            <p className="text-sm text-red-400 flex mt-1">
              {errors.username}
            </p>
          )}
        </div>        
        <div className="mb-4 bg-blu">
          <label
            htmlFor="Dname"
            className="block text-sm font-medium text-gray-400"
          >
            Display Name
          </label>
          <motion.input
            type="text"
            id="Dname"
            placeholder="enter your display name"
            className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800/5 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            whileFocus={{ scale: 1.0 }}
          />
          {errors.displayName && errors.displayName && (
            <p className="text-sm text-red-400 flex mt-1">
              {errors.displayName}
            </p>
          )}
        </div>
        <GenderInput setGender={setGender}/>
        {errors.gender && (
          <p className="text-sm text-red-400 mb-4 flex mt-1">
            {errors.gender}
          </p>
        )}
        <motion.button
          type="button"
          className="w-full rounded-md bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
        >
          {isLoading ? "..." : "create account"}
        </motion.button>
      </form>
    </motion.div>
  );
}
