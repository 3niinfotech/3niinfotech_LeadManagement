/**
 * Static image paths — files live in `public/assets/images/`.
 * Vite serves `public/` at site root, so paths start with `/assets/...`.
 *
 * Folder structure:
 *   public/assets/images/
 *     brand/           — logo, favicon variants
 *     errors/          — error & empty states
 *     illustrations/   — marketing / onboarding art
 */
export const IMAGES = {
  brand: {
    // logo: '/assets/images/brand/logo.png',
  },
  errors: {
    somethingWentWrong: '/assets/images/Something-went-wrong.webp',
  },
  illustrations: {
    // add onboarding / hero art here
  },
  announcements: {
    nursingCareer: '/assets/images/announcements/nursing-career-banner.png',
  },
};

/** Resolve a public asset URL (use for dynamic filenames) */
export function publicImageUrl(...segments) {
  return `/assets/images/${segments.filter(Boolean).join('/')}`;
}
