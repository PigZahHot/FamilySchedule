# Family Schedule Web Application

A full-stack web application designed to track and coordinate family shift rotations, schedules, and calendars seamlessly.

## How to Interpret Shifts

Day Shifts are from 10 am to 10 pm. Starting times are marked with a Sun Symbol (☀️)
Night Shifts are from 10 pm to 10 am the following day. Starting times are marked with a Moon Symbol (🌙)

## Features

- **Automated Shift Calculation:** Dynamically computes work schedules based on custom rotational blocks (e.g., 4-on / 2-off work cycles).
- **Custom Transition Gaps:** Intelligently handles custom transition buffers between shift types (such as specific gap lengths when shifting from Day to Night or Night to Day).
- **Multiple Views:** Clean calendar grids, agenda lists, and year/month layouts built with Next.js.
- **Admin Configuration:** Configurable backend API routes for managing shift exceptions and core configurations. Accessible through /admin in url, requires admin pin.
- **Family Calendar View:** A visual representation of the family's shared schedule.
- **Year / Month Calendar Views:** Tools to view and navigate the calendar on a monthly or yearly basis.
- **Compact Calendar Grid:** A space-efficient grid view for displaying the calendar.
- **Offline Support:** Progressive Web App (PWA) capabilities enable offline access and functionality.
- **Responsive Design:** Optimized for various devices, including smartphones, tablets, and desktops.
- **Family Login:** Secure login system for authenticated access to family-specific features.
- **QR Code Login:** Secure login system for authenticated access to family-specific features. Accessible in Admin page

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database / Backend:** Node.js, PostgreSQL
- **Date Utilities:** `date-fns`

---

## Project Structure

```text
├── app/
│   ├── api/             # Backend API routes (shift config, exceptions)
│   ├── components/      # Frontend UI components (CalendarGrid, AgendaView, YearView)
│   └── page.tsx         # Main entry point
├── lib/
│   └── shift.ts         # Core shift rotation and gap calculation logic
├── package.json
└── README.md
```

## Environment Variables

Create a `.env.local` file in the root directory with the following keys:

```env
FAMILY_PASSPHRASE=your_family_passphrase
ADMIN_PIN=your_admin_pin
DATABASE_URL=postgres://username:password@localhost:5432/family_schedule
```