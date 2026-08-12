import Modal from '../../../../components/ui/Modal';
import ProfileTabs from '../../../../components/ui/ProfileTabs';
import FormStepTabs from '../../../../components/ui/FormStepTabs';
import FormTabPanel from '../../../../components/ui/FormTabPanel';

export default function EnquiryFormModal({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  tabErrors,
  footer,
  floatingActions,
  sidebar,
  workspaceNav,
  useFormTabs = false,
  children,
}) {
  const hasSidebar = Boolean(sidebar);
  const TabNav = useFormTabs ? FormStepTabs : ProfileTabs;
  const layoutId = useFormTabs ? 'crm-enquiry-form-tab' : 'crm-enquiry-profile-tab';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="xl"
      variant="form"
      footer={footer}
      panelOverlay={floatingActions}
      className={`crm-modal-panel--with-fab${hasSidebar ? ' crm-modal-panel--with-analytics' : ''}`}
    >
      <div className={`crm-form-modal-layout${hasSidebar ? ' crm-form-modal-layout--split' : ''}`}>
        <div className="crm-form-modal-layout__main">
          {workspaceNav}
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={onTabChange}
            tabErrors={tabErrors}
            layoutId={layoutId}
          />
          <FormTabPanel panelKey={activeTab} className="mt-2">
            {children}
          </FormTabPanel>
        </div>
        {sidebar}
      </div>
    </Modal>
  );
}
