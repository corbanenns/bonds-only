import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      forcePasswordChange: boolean
      profileCompleted: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    forcePasswordChange: boolean
    profileCompleted: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    forcePasswordChange: boolean
    profileCompleted: boolean
  }
}
