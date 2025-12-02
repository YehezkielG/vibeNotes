"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function BanGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Auto-signout if banned
  useEffect(() => {
    if (session?.user?.isBanned) {
      signOut({ callbackUrl: "/auth" });
    }
  }, [session]);

  // Redirect to onboarding if user hasn't completed onboarding
  useEffect(() => {
    if (status === "loading") return;
    // only run for authenticated users who are not onboarded
    if (session?.user && session.user.isOnboarded === false) {
      // avoid redirect loops: allow access to onboarding page and auth routes
      if (!pathname?.startsWith("/onboarding") && !pathname?.startsWith("/auth")) {
        router.push("/onboarding");
      }
    }
  }, [session, status, pathname, router]);

  if (session?.user?.isBanned) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Account Banned</h1>
          <p className="text-muted-foreground mb-4">
            Your account has been suspended due to a violation of our terms of service.
          </p>
          <p className="text-sm text-muted-foreground">Signing out...</p>
        </div>
      </div>
    );
  }

  // If user is not onboarded and we're on another page, show a simple placeholder while redirect happens
  if (session?.user && session.user.isOnboarded === false && pathname && !pathname.startsWith("/onboarding") && !pathname.startsWith("/auth")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted">Redirecting to onboarding...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <BanGuard>{children}</BanGuard>
    </SessionProvider>
  );
}