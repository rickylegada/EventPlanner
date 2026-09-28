# 🏓 Pickle

A small shared web app for our group: set up pickleball sessions (and birthdays,
and whatever else), see who's coming, tick off who actually turned up, and split
the venue cost between the people who were really there.

Everyone who has the passcode can edit everything. There are no admins — it works
like a shared document.

---

## What it does

- **Events** — name, date and time, venue, a Google Maps link, notes, and a total cost.
- **RSVP** — everyone marks themselves In / Maybe / Out, and anyone can set it for
  the friend who never opens the app.
- **Attendance** — on the day, tick who actually came. Someone who turns up out of
  the blue can be added by name on the spot; they get added to the roster too.
- **Money** — the total splits equally between the people marked as *came*. Tap
  anyone's amount to give them a custom share (e.g. someone who only played two
  games); the rest re-split what's left. Shares always add up to the total exactly,
  down to the centavo.
- **Paid tracking** — a Paid / Unpaid toggle per person, with a note field for
  things like "GCash ref 1234". A bar at the top shows collected vs still to go.
- **Copy summary** — one tap copies a tidy text block to paste into the group chat.
- **Repeat next week** — clones the event 7 days later with the same people and
  costs, RSVPs reset.
- **Calendar** — a month view with a dot on every event day.

It is built mobile-first: big tap targets, no accidental zoom, and it can be added
to your phone's home screen where it opens like a real app.

---

## Setup (one time, about 5 minutes)

### 1. Create the database

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project. Any name and region will do — pick Singapore for the
   lowest latency from the Philippines. Save the database password somewhere; you
   will not need it for this app but Supabase will ask you to set one.
3. In the left sidebar open **SQL Editor**, click **New query**, then paste in the
   whole contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and press **Run**. It creates the three tables and locks them down.
4. Open **Project Settings → Data API** and copy the **Project URL**.
5. Open **Project Settings → API Keys** and copy the **`service_role`** key (click
   to reveal it). This key is powerful — it only ever goes in the two places below,
   never into a chat or a public repo.

### 2. Fill in your local settings

`.env.local` already exists in this folder with a generated `AUTH_SECRET`. Open it
and fill in the two blanks:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
APP_PASSCODE=pickle2026
AUTH_SECRET=(already generated, leave it)
```

Change `APP_PASSCODE` to whatever you want to share with the group.

### 3. Run it

```bash
npm run dev
```

Open http://localhost:3000, enter the passcode, pick your name, and add an event.

---

## Going live so your friends can use it

1. **Put the code on GitHub.** Create an empty repository, then:

   ```bash
   git remote add origin https://github.com/<you>/pickle.git
   git push -u origin main
   ```

   `.env.local` is gitignored, so your keys do not go up.

2. **Deploy on Vercel.** Sign in at [vercel.com](https://vercel.com) with GitHub,
   click **Add New → Project**, and import the repository. Before clicking Deploy,
   open **Environment Variables** and add all four:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | same as in `.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | same as in `.env.local` |
   | `APP_PASSCODE` | the code for the group |
   | `AUTH_SECRET` | same as in `.env.local` |

3. Deploy. You get a `something.vercel.app` link — send that and the passcode to the
   group chat. On a phone, **Share → Add to Home Screen** makes it behave like an app.

Both free tiers cover a group this size comfortably. Nothing here costs money.

Changing `APP_PASSCODE` later signs everyone out, which is what you want if the code
ever leaks. Redeploy after changing it in Vercel.

---

## How the split is calculated

Say the court is ₱2,000 and 10 people are marked as *came* — everyone owes ₱200.

- Only people ticked as **came** are charged. RSVPs are ignored for money.
- If you give someone a custom amount, it comes off the top and the remainder is
  split equally between everyone else. So ₱2,000 with one person set to ₱100 leaves
  ₱1,900 shared between the other nine.
- Uneven divisions are handled to the centavo: ₱2,000 between 3 becomes
  ₱666.67 + ₱666.67 + ₱666.66, which is exactly ₱2,000.
- Unticking someone as *came* also clears their paid flag and custom amount, so a
  mis-tap does not leave stale money on a person who was not there.

The rules live in [`src/lib/money.ts`](src/lib/money.ts) and are covered by tests:

```bash
npm test
```

---

## How it is put together

```
src/
  app/            pages (Next.js App Router)
    login/        passcode screen
    (app)/        everything behind the passcode
  components/     UI pieces
  lib/            money split, dates (Manila), summary text, auth, types
  server/         data fetching and all the write actions
supabase/
  migrations/     the SQL to paste into Supabase
```

Security in one paragraph: the database has Row Level Security on with **no
policies**, which means nothing can read or write it directly. All access goes
through the Next.js server using the `service_role` key, which never reaches the
browser. The passcode is checked on the server and sets a signed, http-only cookie.
So someone who finds the URL still sees nothing without the code.

Dates are stored as UTC and always displayed in Manila time. Money is in PHP.

---

## Removing it from your machine

Everything lives in this one folder — the app, `node_modules`, all of it. Nothing
was installed globally. Delete the folder and it is gone. npm's shared download
cache can be cleared separately with `npm cache clean --force`.

To also remove the hosted side: delete the project in Vercel and the project in
Supabase.
