import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      displayName?: string | null;
      bio?: string | null;
      username?: string | null; // added
      gender?: string | null;   // added
      // add other optional custom fields here
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    displayName?: string | null;
    bio?: string | null;
    username?: string | null; // added
    gender?: string | null;   // added
  }
}
