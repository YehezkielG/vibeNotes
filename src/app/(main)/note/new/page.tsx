"use client"
import { useEffect, useState } from "react";
import TextEditor from "@/components/TextEditor";

export default function NewNotePage(){
  const [labelEmotion, setLabelEmotion] = useState<[]>([]);

  useEffect(() => {
    console.log("Detected Emotion:", labelEmotion);
  }, [labelEmotion]);
  

  return <>
    <TextEditor analyzeEmotion={setLabelEmotion} />    
    {labelEmotion.length > 0 && (
      <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded">
        {labelEmotion.map((item : {label: string, score: number}, index) => (
          <span key={index} className="inline-block mr-2">
            {item.label} ({(item.score * 100).toFixed(2)}%)
          </span>
        ))}
      </div>
    )}
  </>;
}