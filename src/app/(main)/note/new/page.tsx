"use client";
import { useEffect, useRef, useState } from "react";
import TextEditor from "@/components/TextEditor";
import { getEmojiForLabel, getLabelColor } from "@/lib/utils/emotionMapping";

export default function NewNotePage() {
  const [labelEmotion, setLabelEmotion] = useState<
    Array<{ label: string; score: number }>
  >([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (labelEmotion.length > 0) {
      setShowAnalysis(true);
      setAnimateIn(false);
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setShowAnalysis(false);
      setAnimateIn(false);
    }
  }, [labelEmotion]);

  useEffect(() => {
    if (showAnalysis && animateIn && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showAnalysis, animateIn]);

  return (
    <>
      <TextEditor analyzeEmotion={setLabelEmotion} />
      {showAnalysis && (
        <div
          ref={containerRef}
          className={`space-y-3 mt-4 w-full transform transition-all duration-300 ${
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {labelEmotion.map((item: { label: string; score: number }) => (
            <div key={item.label} className="group">
              {/* Label & Persentase */}
              <div className="flex justify-between text-sm mb-1 text-gray-700">
                <span className="flex items-center my-1 gap-2 font-medium capitalize">
                  <span>{getEmojiForLabel(item.label)}</span> {item.label}
                </span>
                <span className="font-mono text-xs text-gray-500">
                  {(item.score * 100).toFixed(1)}%
                </span>
              </div>

              {/* The Bar Background */}
              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                {/* The Bar Value (Animated) */}
                <div
                  className="h-2.5 rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${item.score * 100}%`,
                    backgroundColor: getLabelColor(item.label) 
                  }}
                />
                
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}