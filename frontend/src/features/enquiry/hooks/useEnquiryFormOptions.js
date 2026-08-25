import { useMemo } from 'react';
import {
  ENQUIRY_FORM_OPTIONS,
  ENQUIRY_FORM_CATEGORIES,
  mapCountryPhoneCodeOptions,
} from '../config/enquiryFormOptions.config';
import { useMasterOptions } from '../../master/hooks/useMasterOptions';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';

function mapRelationalOptions(rows) {
  return rows.map((o) => ({
    value: o.label || o.name || o.value,
    label: o.label || o.name || o.value,
  }));
}

/**
 * Enquiry form dropdowns — DB-driven masters. Static values only for non-master fields
 * (gender, marital status, test names). Calling codes come from Country.phoneCode.
 */
export function useEnquiryFormOptions() {
  const { options: applyLevelOptions, loading: applyLevelLoading } = useMasterOptions('applyLevel');
  const { options: qualificationOptions, loading: qualLoading } = useRelationalMasterOptions('qualification');
  const { options: sourceOptions, loading: sourceLoading } = useRelationalMasterOptions('lead-source');
  const { options: countryOptions, loading: countryLoading } = useRelationalMasterOptions('country');
  const { options: intakeOptions, loading: intakeLoading } = useRelationalMasterOptions('intake');

  const phoneCodeOptions = useMemo(() => {
    const fromMaster = mapCountryPhoneCodeOptions(countryOptions);
    return fromMaster.length ? fromMaster : ENQUIRY_FORM_OPTIONS.countryCode;
  }, [countryOptions]);

  const options = useMemo(() => ({
    ...ENQUIRY_FORM_OPTIONS,
    countryCode: phoneCodeOptions,
    highestQual: mapRelationalOptions(qualificationOptions),
    applyLevel: applyLevelOptions.map((o) => ({
      value: o.value || o.label,
      label: o.label || o.value,
    })),
    source: mapRelationalOptions(sourceOptions),
    country: countryOptions.map((o) => ({
      value: o.label || o.name || o.value,
      label: o.label || o.name || o.value,
    })),
    intake: mapRelationalOptions(intakeOptions),
  }), [phoneCodeOptions, qualificationOptions, applyLevelOptions, sourceOptions, countryOptions, intakeOptions]);

  const getOptions = (category) => options[category] ?? [];

  return {
    options,
    categories: ENQUIRY_FORM_CATEGORIES,
    getOptions,
    loading: applyLevelLoading || qualLoading || sourceLoading || countryLoading || intakeLoading,
  };
}
