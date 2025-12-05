import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";
import Google from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { generateMagicLinkEmail, generateMagicLinkTextEmail } from "@/lib/email-templates";
import { Resend as ResendClient } from "resend";

// Normalize auth-related environment URLs so `new URL()` in auth library
function ensureUrlProtocol(u?: string | undefined) {
  if (!u) return u;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) return u;
  return `https://${u}`;
}

process.env.NEXTAUTH_URL = ensureUrlProtocol(process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? process.env.AUTH_URL) ?? process.env.NEXTAUTH_URL;
process.env.AUTH_URL = ensureUrlProtocol(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL) ?? process.env.AUTH_URL;
process.env.NEXTAUTH_URL_INTERNAL = ensureUrlProtocol(process.env.NEXTAUTH_URL_INTERNAL ?? process.env.NEXTAUTH_URL) ?? process.env.NEXTAUTH_URL_INTERNAL;

const resendClient = new ResendClient(process.env.RESEND_API_KEY!);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const host = new URL(url).origin;
        
        try {
          await resendClient.emails.send({
            from: provider.from!,
            to: email,
            subject: "Masuk ke vibeNotes — Link verifikasi Anda",
            html: generateMagicLinkEmail({ url, host, email }),
            text: generateMagicLinkTextEmail({ url, host, email }),
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: 'identify email' } },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  callbacks: {
    async session({ session, user }) {
      // Attach all user fields to session.user
      const { id, username, displayName, image, isOnboarded, email, isBanned, role } = user;
      session.user = {
        id,
        username: username ?? null,
        displayName: displayName ?? null,
        image: image ?? null,
        isOnboarded: isOnboarded ?? false,
        email: email ?? null,
        isBanned: isBanned ?? false,
        role: role ?? 'user',
      };
      return session;
    },
    async signIn({ user, account }) {
      if (!account?.provider || !user?.email) return true;

      const client = await clientPromise;
      const db = client.db();
      const users = db.collection("users");
      const accounts = db.collection("accounts");

      const existingUser = await users.findOne({ email: user.email });
      
      if (existingUser?.isBanned) {
        return "/auth?error=banned"; // Redirect banned users to auth page with message
      }

      if (!existingUser) return true;

      const alreadyLinked = await accounts.findOne({
        userId: existingUser._id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });
      if (alreadyLinked) return true;

      await accounts.updateOne(
        {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
        {
          $set: {
            userId: existingUser._id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: account.session_state ?? null,
            gender: account.gender ?? null,
          },
        },
        { upsert: true },
      );

      return true;
    },
  },
});
