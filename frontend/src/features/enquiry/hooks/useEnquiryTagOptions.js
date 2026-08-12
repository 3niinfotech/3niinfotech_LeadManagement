import { useMemo } from 'react';
import { useMasterOptions } from '../../master/hooks/useMasterOptions';
import { ENQUIRY_TAGS, mapEnquiryTagOptions } from '../config/enquiryTags.config';

/**
 * Enquiry tag options from Tags master (MasterItem) with static fallback.
 */
export function useEnquiryTagOptions({ enabled = true } = {}) {
  const { options, loading, reload, ensureOption } = useMasterOptions('tags', { enabled });

  const tagOptions = useMemo(() => {
    if (options?.length) {
      return mapEnquiryTagOptions(options);
    }
    return ENQUIRY_TAGS;
  }, [options]);

  return { options: tagOptions, loading, reload, ensureOption };
}
