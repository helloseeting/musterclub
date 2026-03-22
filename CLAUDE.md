@AGENTS.md

## Design System

Read and follow `FRONTEND_SKILL.md` before any UI work. It defines the visual standard, composition rules, and quality gates for all Muster.club frontend work.

## Project Context

- **Product**: Muster.club — Guild-based career gig platform, RPG-style rank progression (F→A)
- **Stack**: Next.js 15 (App Router) + Tailwind CSS + Framer Motion + Firebase (Hosting, Auth, Firestore, Storage, Analytics)
- **Deploy**: Firebase Hosting with static export (`next export`). NO Vercel. NO Supabase.
- **Market**: Singapore only (stealth mode)
- **Tone**: Bold, empowering, slightly rebellious. "Career uprising" not "job board."

## Hard Constraints

- Firebase ONLY for all backend services
- Static export must work (`npm run build` → `out/` directory)
- Mobile-first — must look stunning on iPhone
- Dark mode is default, light mode equally polished
- No placeholder Lorem ipsum — all copy must be on-brand guild language
- Two typefaces max (Space Grotesk headings + Inter body)
- One accent color system (indigo → gold for achievements)
