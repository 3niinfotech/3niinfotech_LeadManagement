import { useMemo } from 'react';
import { ENQUIRY_FORM_OPTIONS, ENQUIRY_FORM_CATEGORIES } from '../config/enquiryFormOptions.config';

/**
 * Dynamic form dropdowns — replace static map with masters API when available.
 * @example useGetMasterLookupsQuery() → merge into options by category key
 */
export function useEnquiryFormOptions() {
  const options = useMemo(() => ({ ...ENQUIRY_FORM_OPTIONS }), []);

  const getOptions = (category) => options[category] ?? [];

  return {
    options,
    categories: ENQUIRY_FORM_CATEGORIES,
    getOptions,
    loading: false,
  };
}
