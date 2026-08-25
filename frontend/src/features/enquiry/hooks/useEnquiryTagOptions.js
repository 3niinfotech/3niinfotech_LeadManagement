import { useMemo } from 'react';
import { useMasterOptions } from '../../master/hooks/useMasterOptions';
import { mapEnquiryTagOptions } from '../config/enquiryTags.config';

/**
 * Enquiry tag options from Tags master (MasterItem). Empty until the API returns.
 */
export function useEnquiryTagOptions({ enabled = true } = {}) {
  const { options, loading, reload, ensureOption } = useMasterOptions('tags', { enabled });

  const tagOptions = useMemo(() => mapEnquiryTagOptions(options), [options]);

  return { options: tagOptions, loading, reload, ensureOption };
}
