# 🏰 Muster.club

**Guild-Based Career Gig Platform**
*Your next quest awaits.*

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + Radix UI + Framer Motion |
| Auth | Firebase Authentication (Email + Google) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Analytics | Firebase Analytics |
| Design System | "Guild Royale" — custom tokens, dark mode default |

## Infrastructure

Everything runs on **Firebase** (free tier):
- **Hosting**: Firebase Hosting with global CDN
- **Auth**: Firebase Auth (email/password + Google)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Analytics**: Firebase Analytics

**No Vercel. No Supabase. No AWS. One platform.**

## Development

```bash
npm install
npm run dev     # localhost:3000
npm run build   # static export to out/
```

## Deployment

```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── app/
│   ├── globals.css       # Guild Royale design system
│   ├── layout.tsx        # Root layout + fonts
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/
│   │   ├── button.tsx    # CVA button variants
│   │   └── badge.tsx     # CVA badge variants
│   ├── navbar.tsx        # Glass-morphism navbar
│   ├── quest-card.tsx    # Quest listing card
│   └── rank-badge.tsx    # Shield-shaped rank badge
└── lib/
    ├── constants.ts      # Ranks, categories, districts, XP
    ├── firebase.ts       # Firebase client init
    ├── firestore-schema.ts # Firestore document types
    └── utils.ts          # cn() helper
```

## Links

- 🔗 Notion: [Muster.club Project](https://www.notion.so/Muster-club-Guild-Based-Career-Gig-Platform-3293aa1f486b8196a6f7f7772d8d2ed6)
- 🎯 Status: Sprint 0 — MVP Build (Mar 21-31, 2026)

---

Built in Singapore 🇸🇬
