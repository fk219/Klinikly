# Klinikly: Design Direction

## Concept

**Care, scheduled.** Klinikly is a multi-tenant appointment platform, not a generic health startup. The product is about time that actually exists: a doctor's real schedule, a slot that can be claimed once, and a hospital that only sees its own data. The interface should feel calm, precise, and human, like a well-designed clinic wayfinding system.

**One sentence:** A calm clinical booking system where availability is visible, honest, and claimable.

## Audience and register

- Patients booking around work and family life.
- Hospital admins managing doctors, schedules, and appointment lifecycles.
- Register: calm, competent, transparent. No urgency tricks, no fake social proof, no medical theater.

## Dials

- **ENERGY 1:** quiet and confident.
- **RHYTHM 2:** editorial sections with one strong data module.
- **MOTION 1:** subtle entrances and state changes only.

## Palette

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#F2F4F0` | Cool stone page ground |
| `stone` | `#E6EBE4` | Section bands and cards |
| `ink` | `#10201C` | Primary text and dark panels |
| `pine` | `#1F4D43` | Primary clinical green |
| `sage` | `#DCE5DD` | Soft selected surfaces |
| `coral` | `#C26A4A` | Single warm accent, focus and emphasis |
| `muted` | `rgba(16,32,28,0.62)` | Body copy |
| `line` | `rgba(16,32,28,0.14)` | Rules and borders |

No teal-to-emerald gradients, no purple, no neon, no glassmorphism.

## Typography

- **Display:** Newsreader. Human, literary, calm.
- **Body:** Public Sans. Clear, neutral, trustworthy.
- **Data and labels:** IBM Plex Mono. Times, slots, counts, statuses.
- Fluid display scale with `clamp()`.
- Use tabular numerals for times and appointment data.

## Layout

- 12-column editorial grid, max width 1440px.
- Hero split: 7 columns of editorial copy, 5 columns of a live availability module.
- The availability module is the signature: doctor, date rail, and real time slots that continue into booking.
- Thin rules, quiet surfaces, generous whitespace. No nested cards pretending to be an app.

## Signature moment

**Next available.** The hero shows a real doctor and real bookable slots from the seeded schedule. Choosing a slot carries it into the booking page. If availability cannot load, the module says so honestly and links to the doctor list. No fake slots.

## Motion

- Page entrance: 200-400ms opacity and small translations.
- Slot and date selection: 120-180ms color and border transitions.
- No scroll-triggered opacity that hides content.
- `prefers-reduced-motion: reduce` removes movement while keeping state changes visible.

## Content rules

- Seeded demo data is labeled as demo data.
- No fabricated testimonials, success rates, awards, emergency claims, or phone numbers.
- Availability, doctors, and hospitals come from the API.
- Every link has a real destination.
