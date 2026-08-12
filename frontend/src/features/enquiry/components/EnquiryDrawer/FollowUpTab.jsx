import { useState } from 'react';

import FollowUpActionsPanel from './FollowUpActionsPanel';

import AppointmentPanel from './AppointmentPanel';

import FollowupActionTabs from './FollowupActionTabs';

import { ENQUIRY_FOLLOWUP_ACTIONS } from '../../config/enquiryFollowup.config';



/** Follow-up scheduling and appointment — inline in workspace, no separate page */

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

      <div className="crm-followup-tab-layout__strip">

        <FollowupActionTabs

          actions={ENQUIRY_FOLLOWUP_ACTIONS}

          value={actionType}

          onChange={setActionType}

          layoutId="crm-followup-outreach-indicator"

          ariaLabel="Outreach channels"

          edgeFade={false}

          variant="inline"

        />

      </div>

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

          hideChannelTabs

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

