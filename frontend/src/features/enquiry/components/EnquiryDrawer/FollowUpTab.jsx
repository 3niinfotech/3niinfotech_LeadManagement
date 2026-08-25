import { useState } from 'react';
import FollowUpActionsPanel from './FollowUpActionsPanel';
import AppointmentPanel from './AppointmentPanel';

/** Follow-up scheduling and appointment — clean 2-column card layout */
export default function FollowUpTab({
  register,
  control,
  errors,
  enquiryId,
  enquiry,
  isEditMode,
  onFollowUpLogged,
  onAppointmentBooked,
}) {
  const [actionType, setActionType] = useState('CALL');

  return (
    <div className="crm-followup-tab-layout">
      <div className="crm-followup-appointment-row">
        <FollowUpActionsPanel
          enquiryId={enquiryId}
          enquiry={enquiry}
          isEditMode={isEditMode}
          register={register}
          control={control}
          errors={errors}
          onLogged={onFollowUpLogged}
          actionType={actionType}
          onActionTypeChange={setActionType}
          hideChannelTabs={false}
        />

        <AppointmentPanel
          enquiryId={enquiryId}
          enquiry={enquiry}
          isEditMode={isEditMode}
          onBooked={onAppointmentBooked}
        />
      </div>
    </div>
  );
}
