import { useMemo } from 'react';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import { resolveMasterLabelFromOptions } from '../utils/masterFieldDisplay.utils';

/**
 * Resolve stored master string fields (course, university, etc.) to display labels.
 */
export function useMasterFieldLabels(fields = {}) {
  const needCourse = Boolean(fields.course || fields.interestedCourse);
  const needUniversity = Boolean(fields.university);
  const needCountry = Boolean(fields.country || fields.interestedCountry);

  const { options: courseOptions } = useRelationalMasterOptions('course', {}, { enabled: needCourse });
  const { options: universityOptions } = useRelationalMasterOptions('university', {}, { enabled: needUniversity });
  const { options: countryOptions } = useRelationalMasterOptions('country', {}, { enabled: needCountry });

  return useMemo(() => ({
    course: resolveMasterLabelFromOptions(fields.course || fields.interestedCourse, courseOptions),
    university: resolveMasterLabelFromOptions(fields.university, universityOptions),
    country: resolveMasterLabelFromOptions(fields.country || fields.interestedCountry, countryOptions),
    courseOptions,
    universityOptions,
    countryOptions,
  }), [fields, courseOptions, universityOptions, countryOptions]);
}

export default useMasterFieldLabels;
