# Frontend Skill — Muster.club

Adapted from [OpenAI's frontend-skill](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill) (GPT-5.4 blog, March 2026).

Use this skill when working on any Muster.club UI — landing page, app screens, or marketing surfaces. The quality bar depends on art direction, hierarchy, restraint, imagery, and motion rather than component count.

Goal: ship interfaces that feel deliberate, premium, and current. Default toward award-level composition: one big idea, strong imagery, sparse copy, rigorous spacing, and a small number of memorable motions.

---

## Muster Brand Context

- **Product**: Guild-based career gig platform with RPG-style rank progression (F→A)
- **Vibe**: Bold, empowering, slightly rebellious. Think "career uprising" not "job board"
- **Accent color**: Defined in CSS variables — one primary accent, no purple bias
- **Typography**: Two typefaces max. Expressive display font for headlines, clean sans for body. No Inter/Roboto/Arial defaults.
- **Imagery direction**: Real people working, building, collaborating. In-situ photography over abstract gradients. Guild/community energy, not corporate stock.
- **Stack**: Next.js + Tailwind + Firebase. Static export. No Vercel deployment (Firebase Hosting only).

---

## Working Model

Before building or redesigning any page, write three things:

1. **Visual thesis**: one sentence describing mood, material, and energy
2. **Content plan**: hero → support → detail → final CTA
3. **Interaction thesis**: 2-3 motion ideas that change the feel of the page

Each section gets one job, one dominant visual idea, and one primary takeaway or action.

---

## Beautiful Defaults

- Start with composition, not components.
- Prefer a full-bleed hero or full-canvas visual anchor.
- Make "Muster" the loudest text on the page — not buried in the nav.
- Keep copy short enough to scan in seconds.
- Use whitespace, alignment, scale, cropping, and contrast before adding chrome.
- Limit the system: two typefaces max, one accent color by default.
- Default to cardless layouts. Use sections, columns, dividers, lists, and media blocks instead.
- Treat the first viewport as a poster, not a document.

---

## Landing Pages

Default sequence:

1. **Hero**: Muster brand + promise + CTA + one dominant visual
2. **Support**: one concrete value prop (e.g., free education, guild system, rank progression)
3. **Detail**: atmosphere, how it works, or community story
4. **Final CTA**: join waitlist / sign up / get started

### Hero Rules

- One composition only.
- Full-bleed image or dominant visual plane.
- Canonical full-bleed rule: the hero itself runs edge-to-edge with no inherited page gutters, framed container, or shared max-width; constrain only the inner text/action column.
- Brand first ("Muster"), headline second, body third, CTA fourth.
- No hero cards, stat strips, logo clouds, pill soup, or floating dashboards.
- Keep headlines to ~2-3 lines on desktop, readable in one glance on mobile.
- Keep the text column narrow and anchored to a calm area of the image.
- All text over imagery must maintain strong contrast and clear tap targets.

**Tests:**
- If the first viewport still works after removing the image → the image is too weak.
- If the brand disappears after hiding the nav → the hierarchy is too weak.
- If the first viewport could belong to another brand → the branding is too weak.

### Viewport Budget

- If the first screen includes a sticky/fixed header, that header counts against the hero.
- Combined header + hero content must fit within the initial viewport at common desktop and mobile sizes.
- When using `100vh`/`100svh` heroes, subtract persistent UI chrome (`calc(100svh - header-height)`) or overlay the header.

---

## App UI (Future Muster Dashboard)

Default to Linear-style restraint:

- Calm surface hierarchy
- Strong typography and spacing
- Few colors
- Dense but readable information
- Minimal chrome
- Cards only when the card IS the interaction (e.g., quest cards, guild cards)

Organize around:
- Primary workspace (quest feed, guild view)
- Navigation
- Secondary context (rank progress, notifications)
- One clear accent for action or state

Avoid:
- Dashboard-card mosaics
- Thick borders on every region
- Decorative gradients behind routine product UI
- Multiple competing accent colors
- Ornamental icons that don't improve scanning

---

## Imagery

Imagery must do narrative work.

- Use at least one strong, real-looking image for the landing page and marketing surfaces.
- Prefer in-situ photography: people working, learning, building together.
- Choose or crop images with a stable tonal area for text overlay.
- Do not use images with embedded signage, logos, or typographic clutter fighting the UI.
- Do not generate images with built-in UI frames, splits, cards, or panels.
- If multiple moments are needed, use multiple images — not one collage.

The first viewport needs a real visual anchor. Decorative texture is not enough.

---

## Copy

- Write in product language, not design commentary.
- Let the headline carry the meaning.
- Supporting copy: one short sentence max.
- Cut repetition between sections.
- No prompt language or design commentary leaked into UI.
- Every section gets one responsibility: explain, prove, deepen, or convert.

**Muster tone**: Direct, empowering, slightly edgy. "Join your guild" not "Explore opportunities." "Rise through the ranks" not "Build your career profile."

If deleting 30% of the copy improves the page, keep deleting.

---

## Motion

Use motion to create presence and hierarchy, not noise.

Ship at least 2-3 intentional motions:

1. One entrance sequence in the hero
2. One scroll-linked, sticky, or depth effect
3. One hover, reveal, or layout transition that sharpens affordance

Prefer Framer Motion (or CSS animations for static export) for:
- Section reveals
- Scroll-linked opacity, translate, or scale shifts
- Sticky storytelling
- Menus, drawers, and modal presence effects

Motion rules:
- Noticeable in a quick screen recording
- Smooth on mobile
- Fast and restrained
- Consistent across the page
- Removed if ornamental only

---

## Hard Rules

- No cards by default.
- No hero cards.
- No boxed or center-column hero when the brief calls for full bleed.
- No more than one dominant idea per section.
- No section should need many tiny UI devices to explain itself.
- No headline should overpower the "Muster" brand on branded pages.
- No filler copy.
- No split-screen hero unless text sits on a calm, unified side.
- No more than two typefaces without a clear reason.
- No more than one accent color unless the design system already has a strong palette.
- No purple-on-white defaults. No dark mode bias (unless explicitly chosen).
- Background: don't rely on flat single-color backgrounds; use gradients, images, or subtle patterns.
- Ensure the page loads properly on both desktop and mobile.

---

## Reject These Failures

- Generic SaaS card grid as the first impression
- Beautiful image with weak brand presence
- Strong headline with no clear action
- Busy imagery behind text
- Sections that repeat the same mood statement
- Carousel with no narrative purpose
- App UI made of stacked cards instead of layout
- "Job board" aesthetic — Muster is NOT a job board

---

## Litmus Checks

Before shipping any page, verify:

- [ ] Is "Muster" unmistakable in the first screen?
- [ ] Is there one strong visual anchor?
- [ ] Can the page be understood by scanning headlines only?
- [ ] Does each section have one job?
- [ ] Are cards actually necessary?
- [ ] Does motion improve hierarchy or atmosphere?
- [ ] Would the design still feel premium if all decorative shadows were removed?
- [ ] Does it load and look good on mobile?
- [ ] Does the tone feel like Muster (bold, empowering) not generic SaaS?

---

*Source: Adapted from OpenAI's [frontend-skill](https://github.com/openai/skills/tree/main/skills/.curated/frontend-skill) — [blog post](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4)*
