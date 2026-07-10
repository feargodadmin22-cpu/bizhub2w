import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { rawPrisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await rawPrisma.user.findFirst({ where: { contact: email } });
        if (!user || user.status !== "active") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.contact,
          name: user.name,
          shopId: user.shopId,
          role: user.role,
          canSeeCostAndProfit: user.canSeeCostAndProfit,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    // Stamp our custom fields onto the JWT — this is our replacement
    // for Supabase's custom Auth Hook claims.
    async jwt({ token, user }) {
      if (user) {
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.canSeeCostAndProfit = (user as any).canSeeCostAndProfit;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub;
      (session.user as any).shopId = token.shopId;
      (session.user as any).role = token.role;
      (session.user as any).canSeeCostAndProfit = token.canSeeCostAndProfit;
      (session.user as any).status = token.status;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});