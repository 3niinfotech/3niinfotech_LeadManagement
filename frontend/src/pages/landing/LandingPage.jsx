import { useEffect } from 'react';
import LandingHeader from '../../features/landing/components/LandingHeader';
import LandingHero, { LandingTrustStrip } from '../../features/landing/components/LandingHero';
import {
  LandingAnalytics,
  LandingDestinations,
  LandingFinalCta,
  LandingFooter,
  LandingJourney,
  LandingMultiBranch,
  LandingProductShowcase,
  LandingRolePanels,
  LandingSecurity,
  LandingStudentPortal,
  LandingValueGrid,
  LandingWorkflow,
  LandingWorkspaces,
} from '../../features/landing/components/LandingSections';
import { LANDING_BRAND } from '../../config/landing.config';
import '../../features/landing/styles/landing.theme.css';

/**
 * Public marketing + portal entry landing page.
 * Uses existing login routes — no separate auth system.
 */
export default function LandingPage() {
  useEffect(() => {
    const title = `${LANDING_BRAND.productName} — Study Abroad & Education CRM`;
    const description = 'One platform to manage enquiries, counselling, admissions, applications, academics, fees and visa journeys for education and immigration teams.';
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      <LandingHeader companyName={LANDING_BRAND.name} />
      <main id="main-content">
        <LandingHero />
        <LandingTrustStrip />
        <LandingStudentPortal />
        <LandingWorkspaces />
        <LandingValueGrid />
        <LandingJourney />
        <LandingWorkflow />
        <LandingProductShowcase />
        <LandingAnalytics />
        <LandingMultiBranch />
        <LandingSecurity />
        <LandingRolePanels />
        <LandingDestinations />
        <LandingFinalCta />
      </main>
      <LandingFooter companyName={LANDING_BRAND.name} />
    </div>
  );
}
