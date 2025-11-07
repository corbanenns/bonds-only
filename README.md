# Bonds Only - Private Surety Bonds Group Portal

A secure, private web application for the Bonds Only surety bonds professional group.

## Features

- ✅ **Authentication & MFA**: Email/password login with SMS-based MFA via Twilio
- ✅ **Member Roster**: View all members, add/remove members (admin only)
- ✅ **Events Calendar**: Share and manage group events
- ✅ **Message Board**: Group discussions and announcements
- ✅ **Resource Links**: Shared links repository for important resources
- ✅ **Role-Based Access**: Admin and Member roles with different permissions

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Authentication**: NextAuth.js with Twilio SMS MFA
- **Database**: Vercel Postgres with Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Vercel account
- A Twilio account for SMS

### 1. Install Dependencies

```bash
cd bonds-only
npm install
```

### 2. Set Up Vercel Postgres

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing one
3. Go to **Storage** tab → **Create Database** → **Postgres**
4. Copy the environment variables provided

### 3. Set Up Twilio

1. Sign up at [Twilio](https://www.twilio.com)
2. Get a phone number with SMS capabilities
3. Copy your Account SID, Auth Token, and Phone Number from the console

### 4. Configure Environment Variables

Update the `.env` file with your actual values:

```bash
# Database - From Vercel Postgres
POSTGRES_URL="your-postgres-url"
POSTGRES_PRISMA_URL="your-postgres-prisma-url"
POSTGRES_URL_NON_POOLING="your-postgres-non-pooling-url"
POSTGRES_USER="your-user"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="your-database"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 5. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to manage data
npx prisma studio
```

### 6. Create First Admin User

You can create the first admin user directly in Prisma Studio or using a script.

**Using Prisma Studio:**
1. Run `npx prisma studio`
2. Open the `User` table
3. Create a new record with role set to `ADMIN`
4. For the password field, use a bcrypt hash (use [bcrypt generator](https://bcrypt-generator.com/))

**Phone Number Format:**
- Must include country code (e.g., +1234567890)
- Must be able to receive SMS

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Add all environment variables from your `.env` file
6. Click **Deploy**

### 3. Update NEXTAUTH_URL

After deployment, update the `NEXTAUTH_URL` environment variable:

```bash
NEXTAUTH_URL="https://your-production-url.vercel.app"
```

Redeploy for changes to take effect.

## Project Structure

```
bonds-only/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   └── users/         # User management
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login with MFA
│   │   ├── roster/            # Member roster
│   │   ├── events/            # Events calendar (to be completed)
│   │   ├── messages/          # Message board (to be completed)
│   │   └── links/             # Resource links (to be completed)
│   ├── components/
│   │   ├── ui/                # UI components
│   │   ├── navbar.tsx         # Navigation bar
│   │   └── providers.tsx      # Session provider
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client
│   │   ├── twilio.ts          # Twilio SMS functions
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── next-auth.d.ts     # TypeScript definitions
└── .env                       # Environment variables
```

## Features Status

- ✅ Authentication with MFA
- ✅ Member Roster with Add/Remove
- ⏳ Events Calendar (in progress)
- ⏳ Message Board (in progress)
- ⏳ Resource Links (in progress)

## Security Features

- Password hashing with bcrypt
- SMS-based two-factor authentication
- Protected API routes
- Session-based authentication
- Role-based access control

## Support

For issues or questions, contact the development team.

## License

Private - All Rights Reserved
