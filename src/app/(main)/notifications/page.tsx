"use client";

import useSWR, { mutate as mutateGlobal } from "swr";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BellOff, CheckCircle2, Loader2, X } from "lucide-react";
import { formatCreatedAt } from "@/lib/utils/notesLib";
import { transformAvatar } from "@/lib/utils/image";
import { redirect } from "next/navigation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return res.json();
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const shouldFetch = Boolean(session?.user);
  const { data, isLoading, error, mutate } = useSWR(shouldFetch ? "/api/notifications" : null, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
  const [isToggling, setIsToggling] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);

  const notifications: NotificationItem[] = useMemo(() => data?.notifications ?? [], [data?.notifications]);
  const unreadCount = data?.unreadCount ?? 0;
  const notificationsEnabled = data?.notificationsEnabled ?? true;
  const effectiveEnabled = localEnabled ?? notificationsEnabled;

  useEffect(() => {
    setLocalEnabled(data?.notificationsEnabled ?? null);
  }, [data?.notificationsEnabled]);

  const mutateUnreadSummary = useCallback(() => {
    mutateGlobal("/api/notifications/unread");
  }, []);

  const markAsRead = useCallback(
    async (id?: string, markAll = false) => {
      if (!session?.user) return;
      if (!markAll && !id) return;
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(markAll ? { all: true } : { ids: [id] }),
        });
        await mutate();
        mutateUnreadSummary();
      } catch (err) {
        console.warn("Failed to mark notifications read", err);
      }
    },
    [mutate, mutateUnreadSummary, session?.user],
  );

  const deleteNotifications = useCallback(
    async (id?: string, removeAll = false) => {
      if (!session?.user) return;
      if (!removeAll && !id) return;
      try {
        if (removeAll) {
          setIsDeletingAll(true);
        } else {
          setDeletingId(id ?? null);
        }
        await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(removeAll ? { all: true } : { ids: [id] }),
        });
        await mutate();
        mutateUnreadSummary();
      } catch (err) {
        console.warn("Failed to delete notifications", err);
      } finally {
        if (removeAll) {
          setIsDeletingAll(false);
        } else {
          setDeletingId(null);
        }
      }
    },
    [mutate, mutateUnreadSummary, session?.user],
  );

  const toggleNotifications = useCallback(async () => {
    if (!session?.user || isToggling) return;
    const nextValue = !effectiveEnabled;
    setLocalEnabled(nextValue);
    setIsToggling(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextValue }),
      });
      if (!res.ok) {
        throw new Error("Failed to update notification preference");
      }
      await mutate();
    } catch (err) {
      console.warn("Failed to toggle notifications", err);
      setLocalEnabled(effectiveEnabled);
    } finally {
      setIsToggling(false);
    }
  }, [effectiveEnabled, isToggling, mutate, session?.user]);

  if (!session?.user) {
    redirect("/auth");
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted">Stay in the loop with the latest activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => markAsRead(undefined, true)}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-variant px-3 py-2 text-sm text-muted hover:border-variant disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Mark all as read
          </button>
          <button
            type="button"
            onClick={() => deleteNotifications(undefined, true)}
            disabled={notifications.length === 0 || isDeletingAll}
            className="inline-flex items-center gap-2 rounded-lg border border-variant px-3 py-2 text-sm text-muted hover:border-variant disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete all
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-lg px-4 py-3">
        <label className="flex items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            style={{ accentColor: "var(--accent)" }}
            className="h-4 w-4 rounded border-gray-300"
            checked={effectiveEnabled}
            onChange={toggleNotifications}
            disabled={isToggling}
          />
          <span>Enable in-app notifications</span>
        </label>
        <p className="mt-2 text-xs text-muted">
          Uncheck the box if you don&apos;t want to receive new alerts about likes, replies, or follows.
        </p>
      </div>

      {!effectiveEnabled && (
        <div className="mb-5 rounded-lg border border-variant accent-weak  text-sm text-accent p-2">
          <p className="font-medium">Notifications are disabled.</p>
          <p className="text-accent">Turn them back on to receive new alerts.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={18} />
          Loading notifications...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load notifications. Please try again later.
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-variant bg-card py-16 text-center text-muted">
          <BellOff size={32} className="mb-4 text-muted" />
          <p className="font-medium text-foreground">No notifications yet.</p>
          <p className="text-sm">Recent activity will show up here.</p>
        </div>
      )}

      <ul className="space-y-3">
        {notifications.map((item) => (
          <li key={item.id}>
            <Link
              href={item.targetUrl}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors border-variant`}
              onClick={() => {
                if (!item.isRead) markAsRead(item.id);
              }}
            >
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src={transformAvatar(item.actor?.image ?? "/default-profile.png", 80)}
                  alt={item.actor?.username ?? "User"}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                {!item.isRead && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.message}</p>
                <p className="text-xs text-muted">{formatCreatedAt(item.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      markAsRead(item.id);
                    }}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete notification"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteNotifications(item.id);
                  }}
                  disabled={deletingId === item.id}
                  className="text-muted transition hover:text-foreground disabled:cursor-not-allowed"
                >
                  {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}