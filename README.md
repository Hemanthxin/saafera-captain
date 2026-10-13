# Saafera Captain — driver app

The driver side of Saafera's car booking. One responsive web app for phones and
desktop. Drivers register their own vehicle; travellers in Saafera book that
specific vehicle; the driver is notified instantly and runs the trip.

## The workflow

```
DRIVER (Captain app)                      SAAFERA (traveller)                 ADMIN
────────────────────                      ───────────────────                 ─────
Sign up / sign in (mobile number + password)
Register vehicle + rates + docs
        │ status: pending ───────────────────────────────────────────────▶ reviews in
        │                                                                  Admin → Cab Drivers
        ◀──────────────────────────────── approve / reject (with reason) ──┘
Tap play → "listed"  ───────────────────▶ car appears under Book a car
                                          Picks a car, enters pickup, drop,
                                          time, people  → fare estimate
        ◀── PUSH + in-app alert ───────── booking REQUESTED
Accept / Decline  ──── PUSH ────────────▶ "Driver accepted" + start code + call button
Navigate to pickup
"I've arrived"    ──── PUSH ────────────▶ "Your driver has arrived"
Rider reads start code → Start trip ─ PUSH ▶ "Trip started"
Complete trip     ──── PUSH ────────────▶ "Trip completed — pay the driver directly", rate 1–5
        ◀── PUSH ───────────────────────── rating
```

### Booking states

`requested → accepted → arrived → started → completed`, or ending in `declined`,
`cancelled` (by either side) or `expired`.

### Rules the server enforces

| Rule | Why |
|---|---|
| Only an **approved** vehicle can go live, and only a **listed** one can be booked | Travellers only see verified cars |
| A booking needs a **findable pickup and drop** (so a real distance and fare exist); no ₹0 bookings | The fare is road distance × the driver's rate + base fare |
| Passengers can't exceed the vehicle's **seats** | |
| Pickup can't be in the past | |
| An unanswered request **lapses after 30 minutes** and the traveller is told | No one waits forever |
| A driver can't accept a booking within **3 hours** of another accepted one | One car, one place |
| Arrival / start only from **90 minutes before** pickup | No marking "arrived" the day before |
| Starting needs the rider's **4-digit code**; wrong codes are refused | Proves the right person boarded |
| The start code is **never sent to the driver app**; the rider's phone is released only **after accept** | Privacy |
| Every state change checks the booking's current state in the database | Two taps can't double-apply |
| A traveller can **rate once**, only a **completed** trip | |

Payment is outside the app: the traveller pays the driver directly (cash/UPI). The
fare shown is an estimate from the distance.

## Real-time notifications

Two layers, so nothing is missed:

1. **Web Push** — the server pushes the moment something happens, even if the app or
   browser is closed. Used for the driver (new booking, cancellation, rating) and
   the traveller (accepted, declined, arrived, started, completed, no response).
   Tapping a notification opens the right screen.
2. **Instant in-app refresh** — when a push arrives and the app is open, it refreshes
   immediately and shows the booking pop-up with a chime and vibration. A background
   poll (every 3 s, slowing to 10 s when push is on) is only the safety net.

Setup — generate keys once and set them where the Saafera web app runs:

```bash
npx web-push generate-vapid-keys
# VAPID_PUBLIC_KEY=...   VAPID_PRIVATE_KEY=...   VAPID_SUBJECT=mailto:you@yourdomain
```

Without keys the app still works using polling; the "Turn on alerts" prompt is
hidden. Push works in Chrome/Edge/Firefox/Android; **iPhone** needs the app added to
the Home Screen first (iOS rule). Drivers turn alerts on once from the prompt on the
Drive screen (or Profile → Booking alerts).

## Running it locally

The driver app needs the Saafera web app running — that is where the API and
database live (`/api/driver/*`).

```bash
# terminal 1 — Saafera (needs DATABASE_URL etc. in .env.local as usual)
npm run dev                 # http://localhost:3000

# terminal 2 — driver app
cd driver-app
npm install
npm run dev                 # http://localhost:3100
```

The driver app proxies `/captain-api/*` to `${SAAFERA_URL}/api/driver/*` (default
`http://localhost:3000`, see `next.config.ts`), so there is no CORS setup. Set
`SAAFERA_URL` to the deployed Saafera origin in production. If the Saafera app isn't
running, sign-in says "Can't reach the Saafera server".

Database tables (`cab_drivers`, `cab_vehicles`, `cab_bookings`, `cab_notifications`,
`cab_push_subscriptions`, …) are created on first use, or run
`npm run db:migrate:cabs` in the main project.

### Sign-in: mobile number + password

Drivers **create an account** (name, mobile number, password of 8+ characters, typed
twice) and **sign in** with the mobile number and password — no SMS code needed.

- Passwords are stored hashed (bcrypt); a wrong number and a wrong password give the
  same message.
- **5 wrong attempts lock the account for 10 minutes.**
- **Forgot password:** an admin resets it in Saafera → **Admin → Cab Drivers → Driver
  accounts → Reset password**. That generates a temporary password (shown once, for the
  admin to pass on), clears any lockout and signs the driver out everywhere. The driver
  then signs in and sets their own under **Profile → Change password** (which signs out
  their other devices).
- Phone-number verification by SMS code is not used yet; the OTP endpoints remain on the
  server (`/api/driver/auth/otp`, `/verify`) for when it is switched back on.

The live app is at **https://captain.saafera.com** and talks to **https://saafera.com**
(`SAAFERA_URL` overrides this; see `next.config.ts`).

## Screens

| Screen | What it does |
|---|---|
| Login | Sign in, or create an account (name, mobile, password); admin resets forgotten passwords |
| Register / edit vehicle | Vehicle, rates, documents, photo. Editing re-submits for approval |
| Drive | Map, listed/paused toggle, booking requests with a response countdown, the active booking's steps, "Up next" bookings |
| Bookings | Every booking and its outcome (and rating) |
| Earnings | Today, 7-day chart, all completed trips |
| Alerts | New-booking, cancellation and rating notifications |
| Profile | Rating, vehicle, documents, alert and theme settings, sign out |

## Not built yet

- Payments in the app (fare is settled directly between driver and traveller).
- Live driver location shown to the traveller.
- Document photo uploads (licence/RC numbers are text for the admin to check).
- Replacing the demo map tiles: the map uses plain OpenStreetMap tiles, fine for
  development but not production traffic — switch `TILE_URL` in
  `src/components/DriveMap.tsx` to a hosted provider before launch.

## Where things are

```
driver-app/src/app/login, register     sign in, vehicle registration
driver-app/src/app/(app)/*             drive, trips, earnings, alerts, profile
driver-app/src/lib                     api client, store (state + push), types
driver-app/public/sw.js                service worker (push only; caches nothing)
```

Server side, in the main project: `src/lib/cab/core.ts` (all booking rules),
`src/lib/cab/push.ts` (Web Push), `src/app/api/driver/*` (driver API),
`src/app/api/cars/*` + `src/app/cars/*` (traveller side), `src/app/admin/drivers`
(approval). `public/sw.js` also shows traveller notifications. This folder is
excluded from the main app's TypeScript build in the root `tsconfig.json`.

## Timestamps

Never pass a JS `Date` straight into a query: the driver serialises it in the
server's local timezone and the zone-less column keeps that wall clock (a 5½-hour
shift on an India-time machine). Send `toISOString()::timestamptz AT TIME ZONE 'UTC'`
(see the note in `src/lib/cab/core.ts`).
