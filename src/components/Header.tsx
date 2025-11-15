"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <>
    <header className="flex justify-between py-5">
      <h1 className="font-bold text-xl">vibeNote</h1>
      <div className="">
        <Link className="bg-blue-600 text-white px-4 py-2 rounded-xl" href='/login'>
          Sign In
        </Link>
      </div>
    </header></>
  );
}
