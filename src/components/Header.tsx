"use client";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ...existing code...
  return (
    <header className="flex items-center justify-between py-3">
      {/* logo bisa ditambahkan di kiri nanti */}
      <div className="relative flex items-center">
        {/* ...existing code... */}
      </div>
    </header>
  );
}