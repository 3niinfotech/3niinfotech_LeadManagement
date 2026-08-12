/** Page route & content animations — change timing here globally */

export const pageEase = [0.22, 1, 0.36, 1];

export const routeVariants = {
  initial: { opacity: 1, y: 10, scale: 0.998 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: pageEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.998,
    transition: { duration: 0.18, ease: pageEase },
  },
};

export const pageStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const pageItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: pageEase },
  },
};

export const loaderVariants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.28, ease: pageEase } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
};
