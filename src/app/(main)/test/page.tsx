"use client";
import { useState, useEffect} from "react";

export default function Test() {
  const [numberClick, setNumberClick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- Langkah A: Ambil data dari DB saat halaman di-load ---
  useEffect(() => {
    async function getInitialCount() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/counter'); // Panggil API GET
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        console.log(data);
        setNumberClick(data.count); // Set state dengan data dari DB
      } catch (err) {
        console.error(err);
        setNumberClick(0); // Set 0 jika error
      }
      setIsLoading(false);
    }
    getInitialCount();
    }, []); // Hanya jalankan sekali saat mount


  async function handleClick() {
    // Jangan lakukan apa-apa jika data awal belum ke-load
    if (numberClick === null) return;
    setNumberClick(numberClick + 1);

    try {
      const res = await fetch("/api/counter", { method: "POST" });

      if (!res.ok) {
        setNumberClick(numberClick);
        console.error("Failed to update count in DB");
      }
    } catch (err) {

      setNumberClick(numberClick);
      console.error(err);
    }
  }


  const displayCount = isLoading ? "Loading..." : numberClick;

  return (
    <div className="flex justify-center">
      <div>
        <p>Clicked {displayCount}</p>
        <h1>Simple Number Click APP</h1>
        <button
          onClick={handleClick}
          className="p-2 bg-yellow-400 text-white rounded-lg"
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
