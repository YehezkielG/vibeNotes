import "server-only";
import { HfInference } from "@huggingface/inference";

let hfSingleton: HfInference | null = null;

export function getHfClient() {
  if (!process.env.HUGGINGFACE_TOKEN) {
    throw new Error("HUGGINGFACE_TOKEN is not configured.");
  }
  if (!hfSingleton) {
    hfSingleton = new HfInference(process.env.HUGGINGFACE_TOKEN);
  }
  return hfSingleton;
}


