import {
  FiUsers, FiUserPlus, FiUserCheck, FiFileText, FiSend, FiAward,
  FiGlobe, FiCheckCircle, FiBook, FiPauseCircle, FiXCircle,
} from 'react-icons/fi';
import { STUDENT_STATUSES } from '../../../config/constants';
import { buildSummaryStatItems } from '../../../components/ui/summaryStatBar.helpers';

export const STUDENT_SUMMARY_ICONS = {
  ENQUIRY: FiUserPlus,
  REGISTERED: FiUserCheck,
  DOCUMENT_PENDING: FiFileText,
  APPLICATION_SUBMITTED: FiSend,
  OFFER_RECEIVED: FiAward,
  VISA_APPLIED: FiGlobe,
  VISA_GRANTED: FiCheckCircle,
  ENROLLED: FiBook,
  DEFERRED: FiPauseCircle,
  WITHDRAWN: FiXCircle,
};

export function buildStudentSummaryItems(summary = {}) {
  return buildSummaryStatItems({
    summary,
    statuses: STUDENT_STATUSES.map((s) => ({ ...s, summaryKey: s.value })),
    icons: STUDENT_SUMMARY_ICONS,
    total: {
      key: 'total',
      label: 'Total Students',
      icon: FiUsers,
      tone: 'neutral',
      filterValue: null,
    },
  });
}
