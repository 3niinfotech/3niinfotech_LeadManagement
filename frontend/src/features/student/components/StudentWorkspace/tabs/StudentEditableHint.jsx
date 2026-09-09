import { FiEdit3 } from 'react-icons/fi';

/** Points users to editable tabs from read-only history sections. */
export default function StudentEditableHint({ onTabChange }) {
  return (
    <div className="crm-student-editable-hint">
      <FiEdit3 aria-hidden />
      <p>
        Need to update details?
        {' '}
        <button type="button" onClick={() => onTabChange?.('profile')}>Edit profile</button>
        {' · '}
        <button type="button" onClick={() => onTabChange?.('documents')}>Documents</button>
      </p>
    </div>
  );
}
