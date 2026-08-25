import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiBarChart2 } from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import PageHeader from '../../../components/layout/PageHeader';
import PageShell from '../../../components/layout/PageShell';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import ReportsNav from '../components/ReportsNav';
import {
  ConversionReport,
  SourceReport,
  CountryReport,
  CounsellorReport,
  PerformanceReport,
  FollowUpReport,
  DemoReport,
  AttendanceReport,
  LostReasonReport,
} from '../components/ReportPanels';
import ExportReport from '../components/ExportReport';
import '../styles/reports.css';

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'conversion');
  const [data, setData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const onChangeTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'export') setSearchParams({ tab: 'export' });
    else setSearchParams({});
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGet(API.REPORTS_ENQUIRIES);
        setData(res.data);
        try {
          const att = await apiGet(API.REPORTS_ATTENDANCE);
          setAttendanceData(att.data);
        } catch {
          setAttendanceData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <ContentLoader variant="dashboard" />;

  return (
    <PageShell>
      <PageHeader
        title="Reports"
        subtitle="Enquiry analytics and tenant-safe exports"
        icon={FiBarChart2}
        iconColor="primary"
      />

      <div className="crm-reports-layout">
        <ReportsNav activeTab={activeTab} onChange={onChangeTab} />

        <div className="crm-reports-content">
          {activeTab === 'conversion' && <ConversionReport data={data?.conversion} />}
          {activeTab === 'source' && <SourceReport data={data?.source} />}
          {activeTab === 'country' && <CountryReport data={data?.country} />}
          {activeTab === 'counsellor' && <CounsellorReport data={data?.counsellor} />}
          {activeTab === 'performance' && <PerformanceReport data={data?.performance} />}
          {activeTab === 'followup' && <FollowUpReport data={data?.followUp} />}
          {activeTab === 'demo' && <DemoReport data={data?.demo} />}
          {activeTab === 'attendance' && <AttendanceReport data={attendanceData} />}
          {activeTab === 'lostReason' && <LostReasonReport data={data?.lostReason} />}
          {activeTab === 'export' && <ExportReport />}
        </div>
      </div>
    </PageShell>
  );
}
