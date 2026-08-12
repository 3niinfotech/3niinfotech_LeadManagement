import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

export function useStudentNav() {
  const navigate = useNavigate();

  return {
    openStudent: (id, tab = 'overview') => {
      if (!id) return;
      navigate(tab === 'overview' ? ROUTES.STUDENT_DETAIL(id) : ROUTES.STUDENT_TAB(id, tab));
    },
    openEnquiry: (id) => {
      if (!id) return;
      navigate(ROUTES.ENQUIRY_DETAIL(id));
    },
    backToList: () => navigate(ROUTES.STUDENTS),
    setTab: (id, tab) => navigate(ROUTES.STUDENT_TAB(id, tab), { replace: true }),
  };
}
