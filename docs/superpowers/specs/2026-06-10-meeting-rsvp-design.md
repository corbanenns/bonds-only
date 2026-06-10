# 2026 Annual Meeting RSVP — Design Spec

**Date:** 2026-06-10
**Status:** Draft for review
**Author:** Brainstormed with Claude

## Summary

The 2026 venue is locked in (**The Charleston Place**). The existing `/survey`
page — a location/budget poll (Jackson Hole / Charlotte / Orlando / Other +
budget + guest budget) — is being replaced with an **RSVP** that captures who is
attending, how many people are in their party, and how many hotel rooms they
need. This data drives reservations for dinners, food, and the venue room block.

The old poll data is **archived in place** (not deleted). A new database table
backs the RSVP; the existing poll tables are left untouched.

## Goals

- Let each member declare attendance: **Yes / No / Maybe**.
- Capture **number of people** (member + guests) and **number of hotel rooms**
  for setting venue reservations.
- Surface the contractual stakes of a "Yes" (room block + attrition clause) and
  a "Maybe" (holds nothing) directly in the form.
- Show aggregate totals (confirmed vs. tentative) and a per-member response
  table, visible to all members.

## Non-Goals (this round)

- No changes to email templates or the reminder cron (currently dormant —
  date-gated to March/April 2026, all in the past).
- No acknowledgment checkbox on "Yes" (warning text only).
- No per-field change-history display (the old poll had this; it is being
  dropped to simplify the page).
- No URL change — the page stays at `/survey`.
- No budget, guest-budget, or location fields.

## What the RSVP collects

| Field | Type | Applies to | Notes |
|-------|------|-----------|-------|
| Attendance | Yes / No / Maybe | all | Required |
| Guests beyond yourself | integer 0–10 | Yes, Maybe | 0 = just me, 1 = +1, etc. Total party = 1 + guests |
| Hotel rooms | integer 0–10 | Yes, Maybe | Number of rooms needed |

- **No** records attendance only; guest and room counts are forced to 0.
- **Maybe** counts are estimates, displayed as "not held."
- The form shows a live "Total in your party: N" derived from `1 + guests`.

## Warnings (final wording)

Shown as prominent notices under the choice. **No checkbox** — display only.

- **On "Maybe":**
  > A "Maybe" does not hold a room. Per our contract with the venue, only
  > confirmed "Yes" responses reserve rooms in the block.

- **On "Yes":**
  > Selecting 'Yes' reserves rooms in our group block. Our contract carries a
  > 10% attrition clause — if the group's actual attendance falls more than 10%
  > below the block we reserve, members who cancel may be invoiced for the
  > shortfall. Please only select 'Yes' if you intend to attend.

## Data model

New Prisma model + enum. **Existing `SurveyResponse`, `SurveyResponseHistory`,
and the `LocationChoice` enum stay in the schema, untouched (archived).**

```prisma
enum AttendanceStatus {
  YES
  NO
  MAYBE
}

model MeetingRsvp {
  id         String           @id @default(cuid())
  userId     String           @unique @map("user_id")
  attendance AttendanceStatus
  guestCount Int              @default(0) @map("guest_count")  // guests beyond the member
  roomCount  Int              @default(0) @map("room_count")
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("meeting_rsvps")
}
```

A relation field `meetingRsvp MeetingRsvp?` is added to the `User` model.

**Migration:** additive only (new enum + new table). No columns dropped. Applied
via Prisma against the Vercel/Postgres database.

## API — `src/app/api/survey/route.ts` (repurposed)

The page keeps calling `/api/survey`; the handlers now read/write `MeetingRsvp`.

### `GET`
Returns:
```ts
{
  myResponse: MeetingRsvp | null,
  responses: Array<MeetingRsvp & { user: {id, name, email, profilePicture} }>,
  nonRespondents: Array<{id, name, email, profilePicture}>,
  aggregates: {
    yesCount, noCount, maybeCount, responseCount, totalMemberCount,
    confirmedPeople,   // sum over Yes: 1 + guestCount
    confirmedRooms,    // sum over Yes: roomCount
    tentativePeople,   // sum over Maybe: 1 + guestCount
    tentativeRooms,    // sum over Maybe: roomCount
  },
  isClosed: boolean,
  deadline: string,    // ISO
}
```

### `POST`
Body: `{ attendance, guestCount, roomCount }`.

Validation:
- `attendance` ∈ {YES, NO, MAYBE} — else 400.
- For NO: `guestCount` and `roomCount` coerced to 0.
- For YES/MAYBE: `guestCount` 0–10, `roomCount` 0–10 — else 400.
- Rejects with 403 after the deadline.

Upsert on `userId` (create or update). No history rows.

### Deadline
```ts
const RSVP_DEADLINE = new Date("2026-06-16T23:59:59-04:00") // June 16, 2026, Charleston (ET)
```
After the deadline the form is hidden/locked and the page shows "RSVP closed";
results remain visible.

## UI — `src/app/(authenticated)/survey/page.tsx` (rewritten)

- Header: **"2026 Annual Meeting RSVP"** with subtext referencing The Charleston
  Place, plus the days-remaining / closed badge (kept from current page).
- Form:
  - Three attendance options (Yes / No / Maybe) as selectable cards.
  - When **Yes** selected → Yes warning + guests input + rooms input + party total.
  - When **Maybe** selected → Maybe warning + guests input + rooms input
    (labeled "estimate — not held") + party total.
  - When **No** selected → no counts.
  - Pre-fills from `myResponse`; Submit/Update button.
- Results:
  - Summary tiles: Yes / No / Maybe / not-responded counts.
  - **Confirmed (Yes):** total people, total rooms.
  - **Tentative (Maybe):** additional people, additional rooms, labeled "not held."
  - Table: name · attendance badge · party size (1 + guests) · rooms · last
    updated; non-respondents listed as "Not responded."

## Navbar — `src/components/navbar.tsx`

Relabel the existing `/survey` link text and icon label from **"Survey"** to
**"RSVP"**. No route change.

## Files changed

1. `prisma/schema.prisma` — add `AttendanceStatus` enum + `MeetingRsvp` model + `User.meetingRsvp` relation.
2. `src/app/api/survey/route.ts` — rewrite GET/POST against `MeetingRsvp`.
3. `src/app/(authenticated)/survey/page.tsx` — new RSVP form + results.
4. `src/components/navbar.tsx` — relabel link to "RSVP".
5. Prisma migration for the new table.

## Testing / verification

- Migration applies cleanly; old `survey_responses` rows still present.
- Submit a Yes with guests/rooms → appears in confirmed totals.
- Submit a Maybe → appears in tentative totals, not confirmed.
- Submit a No → counts zeroed, no totals impact.
- Validation rejects out-of-range counts and bad attendance values.
- After June 16, 2026 the form locks and results still render.
- Navbar and page read "RSVP".

## Open items for reviewer

- Confirm the **June 16, 2026** deadline and Eastern (Charleston) timezone.
- Confirm OK to **drop the per-field change-history** display.
- Confirm warning wording is contractually acceptable.
