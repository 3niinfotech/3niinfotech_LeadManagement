(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@crm.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    console.log('Logged in successfully, token received.');

    // 1. Overview for this_month
    const overviewRes = await fetch('http://localhost:5000/api/reports/overview?preset=this_month', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const overviewData = await overviewRes.json();
    console.log('Overview KPIs (this_month):', overviewData.data?.kpis);
    console.log('Overview Invoices:', overviewData.data?.invoices);
    console.log('Overview Needs Attention:', overviewData.data?.needsAttention);

    // 2. Overview for all time / this_year
    const overviewYearRes = await fetch('http://localhost:5000/api/reports/overview?preset=this_year', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const overviewYearData = await overviewYearRes.json();
    console.log('Overview KPIs (this_year):', overviewYearData.data?.kpis);
    console.log('Overview Funnel (this_year):', overviewYearData.data?.conversion?.funnel);

    // 3. Enquiries for this_year
    const enquiriesRes = await fetch('http://localhost:5000/api/reports/enquiries?preset=this_year', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const enquiriesData = await enquiriesRes.json();
    console.log('Enquiries conversion (this_year):', enquiriesData.data?.conversion);
    console.log('Enquiries source (this_year):', enquiriesData.data?.source);
    console.log('Enquiries country (this_year):', enquiriesData.data?.country);
    console.log('Enquiries counsellor (this_year):', enquiriesData.data?.counsellor);
    console.log('Enquiries performance (this_year):', enquiriesData.data?.performance);

  } catch (err) {
    console.error('Error fetching reports:', err);
  }
})();
