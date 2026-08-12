import { useEffect, useState } from 'react';
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
  LostReasonReport,
} from '../components/ReportPanels';
import '../styles/reports.css';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('conversion');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGet(API.REPORTS_ENQUIRIES);
        setData(res.data);
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
        subtitle="Enquiry analytics — conversion, source, counsellor performance, and more"
        icon={FiBarChart2}
        iconColor="primary"
      />

      <div className="crm-reports-layout">
        <ReportsNav activeTab={activeTab} onChange={setActiveTab} />

        <div className="crm-reports-content">
          {activeTab === 'conversion' && <ConversionReport data={data?.conversion} />}
          {activeTab === 'source' && <SourceReport data={data?.source} />}
          {activeTab === 'country' && <CountryReport data={data?.country} />}
          {activeTab === 'counsellor' && <CounsellorReport data={data?.counsellor} />}
          {activeTab === 'performance' && <PerformanceReport data={data?.performance} />}
          {activeTab === 'followup' && <FollowUpReport data={data?.followUp} />}
          {activeTab === 'demo' && <DemoReport data={data?.demo} />}
          {activeTab === 'lostReason' && <LostReasonReport data={data?.lostReason} />}
        </div>
      </div>
    </PageShell>
  );
}
