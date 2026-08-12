import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

export function useEnquiryNav() {
  const navigate = useNavigate();

  return {
    openEnquiry: (id, tab = 'overview') => {
      if (!id) return;
      navigate(tab === 'overview' ? ROUTES.ENQUIRY_DETAIL(id) : ROUTES.ENQUIRY_TAB(id, tab));
    },
    openStudent: (id, tab = 'overview') => {
      if (!id) return;
      navigate(tab === 'overview' ? ROUTES.STUDENT_DETAIL(id) : ROUTES.STUDENT_TAB(id, tab));
    },
    openCreate: () => navigate(ROUTES.ENQUIRY_CREATE),
    backToList: () => navigate(ROUTES.ENQUIRIES),
    setTab: (id, tab) => navigate(ROUTES.ENQUIRY_TAB(id, tab), { replace: true }),
    setCreateTab: (tab) => navigate(
      tab === 'personal' ? ROUTES.ENQUIRY_CREATE : ROUTES.ENQUIRY_CREATE_TAB(tab),
      { replace: true },
    ),
  };
}
