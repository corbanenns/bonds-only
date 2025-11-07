# Bonds Only Group - Project Overview

**Last Updated:** November 7, 2025
**Status:** Active Development
**Environment:** Production (Vercel + Neon PostgreSQL)

## Executive Summary

Private member management platform for the Bonds Only surety bonds professional group. Provides secure authentication, member roster with interactive US map visualization, events calendar, message board, resource links, and comprehensive member profiles with onboarding workflow.

## 🚀 Quick Links

- **Production URL:** [Deployed on Vercel]
- **GitHub Repository:** [Project repo]
- **Database:** Neon PostgreSQL (Serverless Postgres)
- **Local Dev:** http://localhost:3000

## 📊 Current Feature Status

### ✅ Completed Features

1. **Authentication System**
   - Email/password login with bcrypt hashing
   - NextAuth.js session management
   - MFA flow removed (simplified login)
   - Protected routes via middleware
   - Role-based access control (Admin/Member)

2. **Onboarding & Profile Management**
   - First-time user onboarding flow
   - Password change enforcement
   - Profile completion wizard
   - Profile picture upload
   - LinkedIn profile integration
   - Phone number formatting
   - City/state geocoding for map visualization

3. **Member Roster**
   - View all members with pagination
   - Search functionality
   - Profile picture display
   - LinkedIn links
   - Interactive US map showing member locations by state
   - Admin controls: Add/remove members
   - Bulk import from Excel

4. **Events Calendar**
   - Calendar view with react-big-calendar
   - Create/edit/delete events
   - Event details and descriptions
   - Date/time management

5. **Message Board**
   - Create discussion posts
   - Reply to posts
   - Edit/delete posts
   - Chronological feed

6. **Resource Links**
   - Shared links repository
   - Categorization
   - Add/edit/delete links
   - Description and URL management

7. **Agency Management**
   - Agency profiles
   - Associate users with agencies
   - Agency-specific views

### 🔄 In Progress / Planned

- Email notifications (nodemailer configured)
- SMS notifications (Twilio integrated)
- Advanced search and filtering
- Activity feed
- File attachments for posts
- Event RSVP system
- Member directory export

## 🛠 Technology Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Turbopack** - Fast build system

### Backend & Database
- **Neon PostgreSQL** - Serverless Postgres database
- **Prisma 6.19.0** - ORM with type-safe queries
- **NextAuth.js 4.24.13** - Authentication framework
- **@next-auth/prisma-adapter** - Database adapter

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Headless component primitives
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-label
  - @radix-ui/react-slot
  - @radix-ui/react-toast
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Conditional class names

### Features & Integrations
- **bcryptjs** - Password hashing
- **Twilio 5.10.4** - SMS notifications
- **Nodemailer 7.0.10** - Email notifications
- **react-big-calendar 1.19.4** - Events calendar
- **react-simple-maps 3.0.0** - US map visualization
- **date-fns 4.1.0** - Date formatting
- **xlsx 0.18.5** - Excel import/export

### Deployment & Hosting
- **Vercel** - Hosting and CI/CD
- **Neon** - PostgreSQL database hosting
- **GitHub** - Version control

### Development Tools
- **ESLint 9** - Code linting
- **TypeScript Types** - @types packages for bcryptjs, node, nodemailer, react, react-dom, react-big-calendar, react-simple-maps
- **ts-node** - TypeScript execution for scripts
- **tsx** - TypeScript runner
- **dotenv** - Environment variable management

## 📁 Project Structure

```
bonds-only/
├── prisma/
│   ├── schema.prisma              # Database schema with 8 models
│   └── seed.ts                    # Database seeding script
├── src/
│   ├── app/
│   │   ├── (authenticated)/       # Protected routes group
│   │   │   ├── dashboard/         # Member dashboard
│   │   │   ├── events/            # Events calendar
│   │   │   ├── links/             # Resource links
│   │   │   ├── messages/          # Message board
│   │   │   ├── onboarding/        # First-time user setup
│   │   │   ├── roster/            # Member directory
│   │   │   ├── settings/          # Profile settings
│   │   │   └── layout.tsx         # Auth layout wrapper
│   │   ├── api/
│   │   │   ├── agencies/          # Agency CRUD operations
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── [...nextauth]/ # NextAuth handler
│   │   │   │   ├── send-mfa/      # MFA code sending
│   │   │   │   └── verify-mfa/    # MFA verification
│   │   │   ├── events/            # Events API
│   │   │   ├── links/             # Links API
│   │   │   ├── posts/             # Message board API
│   │   │   ├── profile/           # User profile updates
│   │   │   ├── search/            # Global search
│   │   │   ├── upload/            # File upload handler
│   │   │   └── users/             # User management
│   │   │       └── import/        # Excel import
│   │   ├── login/                 # Login page
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── ui/                    # Radix UI components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   ├── MemberMap.tsx          # US map with state markers
│   │   ├── navbar.tsx             # Navigation bar
│   │   └── providers.tsx          # Session provider wrapper
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── notifications.ts       # Email/SMS helpers
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── twilio.ts              # Twilio SMS functions
│   │   └── utils.ts               # Utility functions
│   ├── types/
│   │   └── next-auth.d.ts         # NextAuth type extensions
│   └── middleware.ts              # Route protection
├── public/
│   └── uploads/                   # User-uploaded files
├── .env                           # Environment variables (local)
├── .env.production                # Production env vars
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind configuration
├── package.json                   # Dependencies and scripts
├── README.md                      # Setup instructions
└── PROJECT_OVERVIEW.md            # This file

```

## 🗄 Database Schema (Prisma)

### Models

1. **User**
   - Core user data (email, password, name, phone)
   - Profile fields (bio, linkedIn, profilePicture, address, city, state)
   - Role (ADMIN, MEMBER)
   - Agency relationship
   - Onboarding status tracking
   - Relations: Agency, Event, Post, Link

2. **Agency**
   - Agency information (name, city, state, website)
   - Relations: Users, Events, Links

3. **Event**
   - Calendar events (title, description, start, end, location)
   - Creator relationship
   - Agency relationship

4. **Post**
   - Message board posts (title, content)
   - Author relationship
   - Timestamps

5. **Link**
   - Resource links (title, url, description, category)
   - Creator relationship
   - Agency relationship

6. **Account** (NextAuth)
   - OAuth provider accounts

7. **Session** (NextAuth)
   - User sessions

8. **VerificationToken** (NextAuth)
   - Email verification tokens

### Key Relationships
- User → Agency (Many-to-One)
- User → Events/Posts/Links (One-to-Many creator)
- Agency → Users/Events/Links (One-to-Many)

## 🔐 Environment Variables

### Required Variables (.env / .env.production)

```bash
# Database - Neon PostgreSQL
POSTGRES_PRISMA_URL="postgresql://user:pass@host/db?connect_timeout=15&sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host/db?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"  # Production URL in prod

# Twilio (SMS Notifications)
TWILIO_ACCOUNT_SID="ACxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email (Nodemailer)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@bondsonly.com"
```

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "@next-auth/prisma-adapter": "^1.0.7",
  "@prisma/client": "^6.19.0",
  "@radix-ui/react-*": "various versions",
  "bcryptjs": "^3.0.3",
  "next": "16.0.1",
  "next-auth": "^4.24.13",
  "nodemailer": "^7.0.10",
  "prisma": "^6.19.0",
  "react": "19.2.0",
  "react-big-calendar": "^1.19.4",
  "react-simple-maps": "^3.0.0",
  "twilio": "^5.10.4"
}
```

## 🚀 Getting Started

### Initial Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database
npm run seed
```

### Development

```bash
# Start dev server
npm run dev

# Access at http://localhost:3000

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Database Management

```bash
# Push schema changes
npx prisma db push --accept-data-loss

# Generate Prisma client
npx prisma generate

# Create migration (production)
npx prisma migrate dev --name description

# Deploy migrations
npx prisma migrate deploy
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
git push origin main  # Auto-deploys via Vercel GitHub integration
```

## 🎨 Key Features Implementation

### Member Map Geocoding

The roster page includes an interactive US map showing member locations:

1. **Data Source:** User `address` field parsed for city/state
2. **State Extraction:** `extractState()` function in MemberMap.tsx
   - Supports state codes (AZ, CA, TX)
   - Supports full state names (Arizona, California, Texas)
3. **Coordinate Mapping:** `stateCoordinates` lookup table (lines 6-57)
4. **Visualization:** react-simple-maps with markers and tooltips
5. **Member Count:** Aggregates members per state

### Onboarding Flow

First-time users are guided through profile completion:

1. **Password Change** (if needed)
2. **Profile Information**
   - Name, phone, LinkedIn
   - City, state (for map)
   - Profile picture upload
3. **Completion Flag** (`profileCompleted` in database)
4. **Redirect** to dashboard after completion

### Profile Picture Upload

1. **Upload API:** `/api/upload` route
2. **Storage:** `public/uploads/` directory
3. **Database:** Stores filename in `User.profilePicture`
4. **Display:** Shown in roster and navbar

### Admin Controls

Admins (Kara Schiffner, Sara Robinson) have additional permissions:

- Add/remove users
- Bulk import members from Excel
- Edit all events/posts/links
- Access agency management

## 📝 Recent Git Commits

```
6473e69 Add Kara and Sara as admins, format phone numbers, improve roster display
0c0aa8f Add profile picture and LinkedIn to settings and roster pages
6e6f024 Add comprehensive onboarding system with password change and profile completion
6ddfc74 Update logo with new Bonds Only design
c4bda04 Force redirect with window.location after successful login
2337503 Add detailed logging to login for debugging
217fc19 Simplify login - completely remove MFA flow
17bd272 Update login button text - MFA already disabled
b875726 Remove SQLite migrations for PostgreSQL deployment
2e9b399 Update schema to support Vercel Postgres
ff84b36 Fix nodemailer createTransport typo
a46752e Add types for react-simple-maps
b17018a Fix Next.js 16 async params in API routes
7e49eb1 Add .npmrc for legacy peer deps support
8a7bad5 Initial commit: Bonds Only Group member management platform
```

## 🔧 Common Issues & Solutions

### Issue: "Unknown argument 'profilePicture'" Error

**Cause:** Prisma schema changes not synced to database
**Solution:**
```bash
# Stop dev server
# Push schema to database
npx prisma db push --accept-data-loss
# Regenerate Prisma client (happens automatically)
# Restart dev server
npm run dev
```

### Issue: "No record was found for an update" (P2025)

**Cause:** User ID in session doesn't exist in database
**Solution:** Check session data, verify user exists, or re-login

### Issue: File Lock on query_engine-windows.dll.node

**Cause:** Dev server still running or file locked by antivirus
**Solution:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe
# Wait 2-3 seconds
# Restart dev server
npm run dev
```

### Issue: Port 3000 Already in Use

**Cause:** Previous dev server still running
**Solution:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe
# Or use alternate port
npm run dev -- -p 3001
```

## 🎯 Next Steps / Roadmap

### Short-term (Next Sprint)
- [ ] Test profile update functionality end-to-end
- [ ] Verify city/state geocoding accuracy on map
- [ ] Add loading states for async operations
- [ ] Improve error handling and user feedback
- [ ] Add email notifications for new posts/events

### Medium-term (Next Month)
- [ ] Event RSVP system
- [ ] File attachments for posts
- [ ] Advanced search across all content
- [ ] Activity feed/notifications
- [ ] Member directory export (PDF/Excel)
- [ ] Mobile responsive improvements

### Long-term (Future)
- [ ] Real-time messaging/chat
- [ ] Document repository
- [ ] Member analytics dashboard
- [ ] Integration with external surety tools
- [ ] Mobile app (React Native)

## 👥 Team & Contacts

- **Admins:** Kara Schiffner, Sara Robinson
- **Developer:** [Your name]
- **Deployment:** Vercel auto-deploy on `main` branch

## 📚 Additional Documentation

- **README.md** - Setup and installation guide
- **prisma/schema.prisma** - Database schema with inline comments
- **Git Commits** - Historical development notes

## 🔗 External Services

1. **Neon** - PostgreSQL database hosting
   - Dashboard: https://console.neon.tech
   - Connection pooling enabled
   - Serverless architecture

2. **Vercel** - Application hosting and CI/CD
   - Dashboard: https://vercel.com/dashboard
   - Auto-deploys from GitHub
   - Environment variables configured in dashboard

3. **Twilio** - SMS notifications (optional)
   - Console: https://console.twilio.com
   - Phone number required for SMS
   - Account SID and Auth Token needed

4. **GitHub** - Version control
   - Repository: [Add repo URL]
   - Commits auto-trigger Vercel deployments

---

**For Claude AI:** This document serves as a comprehensive reference for continuing development on this project. All technology stack details, architecture decisions, and implementation notes are captured here for session continuity.
