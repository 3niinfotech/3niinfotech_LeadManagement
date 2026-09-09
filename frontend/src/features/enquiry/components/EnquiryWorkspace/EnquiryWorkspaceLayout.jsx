import { FiArrowLeft, FiInbox } from 'react-icons/fi';
import ModulePageCard, { ModulePageLayout } from '../../../../components/layout/ModulePageLayout';
import FormStepTabs from '../../../../components/ui/FormStepTabs';
import FormTabPanel from '../../../../components/ui/FormTabPanel';
import EnquiryTabPanel from './EnquiryTabPanel';
import Button from '../../../../components/ui/Button';
import EnquiryWorkspaceTabs from './EnquiryWorkspaceTabs';
import EnquiryPageHeader from './EnquiryPageHeader';
import StudentPageHeader from '../../../student/components/StudentWorkspace/StudentPageHeader';

export default function EnquiryWorkspaceLayout({
  title,
  subtitle,
  icon: Icon = FiInbox,
  breadcrumbs = [],
  enquiry,
  student,
  tabs,
  activeTab,
  onTabChange,
  tabErrors,
  useFormTabs = false,
  actions,
  quickActions,
  footer,
  onBack,
  children,
}) {
  const TabNav = useFormTabs ? FormStepTabs : EnquiryWorkspaceTabs;
  const layoutId = useFormTabs ? 'crm-enquiry-form-tab' : undefined;
  const isDetailView = Boolean(enquiry) || Boolean(student);
  const TabPanel = isDetailView ? EnquiryTabPanel : FormTabPanel;

  return (
    <div className="h-full min-h-0 flex flex-col">
      {isDetailView ? (
        <ModulePageLayout className={student ? 'crm-student-workspace--detail' : 'crm-enquiry-workspace--detail'}>
          {enquiry ? (
            <EnquiryPageHeader
              enquiry={enquiry}
              breadcrumbs={breadcrumbs}
              quickActions={quickActions}
              onBack={onBack}
            />
          ) : (
            <StudentPageHeader
              student={student}
              breadcrumbs={breadcrumbs}
              quickActions={quickActions}
              onBack={onBack}
            />
          )}
          <div className="crm-enquiry-page flex-1 min-h-0">
            <div className="crm-enquiry-page__main">
              <div className="crm-enquiry-page__tabs">
                <TabNav
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={onTabChange}
                  tabErrors={tabErrors}
                />
              </div>
              <div className="crm-enquiry-page__content">
                <TabPanel panelKey={activeTab}>
                  {children}
                </TabPanel>
              </div>
              {footer ? (
                <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t border-border bg-card-bg">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>
        </ModulePageLayout>
      ) : (
        <ModulePageCard
          title={title}
          subtitle={subtitle}
          icon={Icon}
          breadcrumbs={breadcrumbs}
          actions={(
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {actions}
              {onBack ? (
                <Button variant="outline" icon={FiArrowLeft} onClick={onBack}>
                  Back to list
                </Button>
              ) : null}
            </div>
          )}
        >
          <div className="crm-enquiry-page flex-1 min-h-0">
            <div className="crm-enquiry-page__main">
              <div className="crm-enquiry-page__tabs">
                <TabNav
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={onTabChange}
                  tabErrors={tabErrors}
                  {...(layoutId ? { layoutId } : {})}
                />
              </div>
              <div className="crm-enquiry-page__content">
                <TabPanel panelKey={activeTab}>
                  {children}
                </TabPanel>
              </div>
              {footer ? (
                <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t border-border bg-card-bg">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>
        </ModulePageCard>
      )}
    </div>
  );
}
