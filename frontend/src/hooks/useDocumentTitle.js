import { useEffect } from 'react';

const BRAND_NAME = '3ni InfoTech';

/**
 * Custom hook to dynamically set the document title
 * @param {string} title - The page title
 * @param {boolean} [retainOnUnmount=false] - Whether to keep title after unmount
 */
export function useDocumentTitle(title, retainOnUnmount = false) {
  useEffect(() => {
    if (!title) return;
    const previousTitle = document.title;
    const formattedTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
    document.title = formattedTitle;

    return () => {
      if (!retainOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, retainOnUnmount]);
}

export default useDocumentTitle;
