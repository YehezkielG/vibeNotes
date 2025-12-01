"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Globe, Lock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getLabelColor } from "../../../lib/utils/emotionMapping";
import InsightSkeleton from "@/components/skeletons/InsightSkeleton";

type UserStats = {
  publicCount: number;
  privateCount: number;
  publicEmotionDistribution: Record<string, number>;
  privateEmotionDistribution: Record<string, number>;
};

type TopNote = {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  likes?: number;
  responses?: unknown[];
};

export default function InsightPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>({
    publicCount: 0,
    privateCount: 0,
    publicEmotionDistribution: {},
    privateEmotionDistribution: {},
  });
  const [topNotes, setTopNotes] = useState<TopNote[]>([]);
  const [weeklyWhisper, setWeeklyWhisper] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, whisperRes, topRes] = await Promise.all([
          fetch("/api/notes/analyze"),
          fetch("/api/notes/weekly-insight"),
          fetch("/api/notes/top"),
        ]);

        if (statsRes.ok) {
          const stats = await statsRes.json()
          console.log(stats)
          setUserStats(stats);
        }

        if (whisperRes.ok) {
          const whisper = await whisperRes.json();
          setWeeklyWhisper(whisper.insight || "");
        }

        if (topRes.ok) {
          const top = await topRes.json();
          setTopNotes(top.notes || []);
        }
      } catch (error) {
        console.error("Error fetching insight data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.user?.id]);

  // Prepare chart data for public emotions
  type ChartEntry = { name: string; value: number; color: string; rawKey?: string };

  const buildTopChartData = (distribution: Record<string, number> | undefined): ChartEntry[] => {
    if (!distribution) return [];
    const entries = Object.entries(distribution).map(([k, v]) => ({ key: k, value: v }));
    const total = entries.reduce((s, e) => s + (typeof e.value === 'number' ? e.value : 0), 0);
    if (total === 0) return [];

    const sorted = entries.sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const topData: ChartEntry[] = top.map((e) => ({
      name: e.key.charAt(0).toUpperCase() + e.key.slice(1),
      value: Math.round((e.value / total) * 1000) / 10, // percent with 1 decimal
      color: getLabelColor(e.key.toLowerCase()),
      rawKey: e.key,
    }));

    if (others.length) {
      const otherSum = others.reduce((s, o) => s + o.value, 0);
      topData.push({
        name: 'Other',
        value: Math.round((otherSum / total) * 1000) / 10,
        color: '#CBD5E1', // light gray for other
        rawKey: 'other',
      });
    }

    return topData;
  };

  const publicChartData = buildTopChartData(userStats.publicEmotionDistribution);

  // Prepare chart data for private emotions
  const privateChartData = buildTopChartData(userStats.privateEmotionDistribution);

  if (status === "loading" || loading) {
    return <InsightSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 pb-6 md:pb-10">
        {/* Header Section */}
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            Self Reflection
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Your emotional journey over the past week
          </p>
        </header>
        {/* Top row: stats + top 3 public notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
            <div className="flex flex-col gap-4">
              <div className="bg-card rounded-lg p-4 border border-variant text-center w-full">
                <p className="text-sm text-gray-500">Public (7 days)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{userStats.publicCount}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-variant text-center w-full">
                <p className="text-sm text-gray-500">Private (7 days)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{userStats.privateCount}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface rounded-xl p-6 shadow-sm border border-variant">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Public Notes</h3>
            {topNotes.length > 0 ? (
              <div className="space-y-4">
                {topNotes.map((n) => (
                  <div key={n._id || n.id} className="p-4 rounded-lg border border-variant bg-card">
                    <p className="text-sm text-gray-900 font-semibold mb-1">{n.title || (n.content || '').slice(0, 60) + (n.content && n.content.length > 60 ? '...' : '')}</p>
                    <p className="text-xs text-gray-600">{(n.content || '').slice(0, 120)}{(n.content && n.content.length > 120) ? '...' : ''}</p>
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
                      <span>❤️ {n.likes || 0}</span>
                      <span>💬 {Array.isArray(n.responses) ? n.responses.length : 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">No public notes yet.</div>
            )}
          </div>
        </div>

        {/* Second row: Public Emotional Patterns + Private Emotional Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Public Emotional Patterns */}
          <div className="bg-surface rounded-xl shadow-sm border border-variant py-2">
            <h2 className="text-lg font-semibold justify-center flex items-center w-full gap-2 text-gray-900">
              <Globe className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              Public Emotional Patterns
            </h2>
            <div className="aspect-square w-full max-w-sm mx-auto rounded-lg flex items-center justify-center">
              {publicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={publicChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={56}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {publicChartData.map((entry, index) => (
                        <Cell key={`cell-public-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const p = payload[0];
                        return (
                          <div className="bg-card p-2 rounded border border-variant shadow text-sm">
                            <div className="font-medium text-gray-800">{p.name}</div>
                            <div className="text-gray-600">{p.value}%</div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="bg-card rounded-lg p-6 border border-variant w-full h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm text-center">
                    No public emotional data yet.
                    <br />
                    Start sharing your feelings!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Private Emotional Patterns */}
          <div className="bg-surface rounded-xl shadow-sm border border-variant py-2">
            <h2 className="text-lg font-semibold flex justify-center items-center w-full gap-2 text-gray-900">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              Private Emotional Patterns
            </h2>
            <div className="aspect-square w-full max-w-sm mx-auto rounded-lg flex items-center justify-center">
              {privateChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={privateChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={56}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {privateChartData.map((entry, index) => (
                        <Cell key={`cell-private-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const p = payload[0];
                        return (
                          <div className="bg-card p-2 rounded border border-variant shadow text-sm">
                            <div className="font-medium text-gray-800">{p.name}</div>
                            <div className="text-gray-600">{p.value}%</div>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="bg-card rounded-lg p-6 border border-variant w-full h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm text-center">
                    No private emotional data yet.
                    <br />
                    Keep your thoughts private!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Third row: Weekly Whisper (Full Width) */}
        <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Weekly Whisper</span>
          </h2>

          {weeklyWhisper ? (
            <blockquote className="relative bg-card rounded-lg p-6 border border-variant">
              <div className="absolute -top-3 -left-2 text-5xl text-indigo-300/40 font-serif">
                &ldquo;
              </div>
              <p className="text-base md:text-lg leading-relaxed italic font-serif text-gray-800 pl-6 pr-4 pt-2">
                {weeklyWhisper}
              </p>
              <div className="absolute -bottom-6 -right-2 text-5xl text-indigo-300/40 font-serif">
                &rdquo;
              </div>
            </blockquote>
            ) : (
            <div className="bg-card rounded-lg p-6 border border-variant text-center">
              <p className="text-gray-600 text-sm">
                No weekly reflection available yet
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="text-lg">🍃</span>
              VibeCounselor
            </span>
            <span>
              {new Date().toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-6 bg-surface border border-variant rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300">
            💡 This reflection is generated based on your notes from the past 7 days
            using AI to provide meaningful perspectives.
          </p>
        </div>
      </div>
    </div>
  );
}
