import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        console.log("🔐 AUTHORIZE - Attempting login for:", credentials.email)

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          console.log("❌ AUTHORIZE - User not found or no password")
          throw new Error("Invalid credentials")
        }

        console.log("✅ AUTHORIZE - User found:", user.email, "ID:", user.id)

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log("❌ AUTHORIZE - Invalid password")
          throw new Error("Invalid credentials")
        }

        console.log("✅ AUTHORIZE - Password valid, returning user data")

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        console.log("🎫 JWT - New user login, setting token ID:", user.id)
        token.id = user.id
        token.role = user.role
        token.forcePasswordChange = user.forcePasswordChange
        token.profileCompleted = user.profileCompleted
      }

      // Refresh token data on update
      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            forcePasswordChange: true,
            profileCompleted: true,
          },
        })
        if (updatedUser) {
          token.forcePasswordChange = updatedUser.forcePasswordChange
          token.profileCompleted = updatedUser.profileCompleted
        }
      }

      console.log("🎫 JWT - Token ID:", token.id)
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("📋 SESSION - Setting session user ID from token:", token.id)
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.forcePasswordChange = token.forcePasswordChange as boolean
        session.user.profileCompleted = token.profileCompleted as boolean
      }
      return session
    },
  },
}
