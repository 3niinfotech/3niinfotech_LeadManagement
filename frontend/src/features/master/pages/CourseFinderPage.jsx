import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiBookOpen, FiExternalLink } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { ROUTES } from '../../../config/routes';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { useAsyncMasterOptions } from '../../master/hooks/useAsyncMasterOptions';
import MasterManageLink from '../../master/components/MasterManageLink';

export default function CourseFinderPage() {
  const [countryId, setCountryId] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');

  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('country');
  const courseParams = useMemo(
    () => (countryId ? { countryId } : {}),
    [countryId],
  );
  const resourceParams = useMemo(
    () => (countryId ? { countryId } : {}),
    [countryId],
  );

  const {
    options: courseOptions,
    loading: coursesLoading,
    setSearch: setCourseLookup,
  } = useAsyncMasterOptions('course', courseParams);

  const {
    options: resourceOptions,
    loading: resourcesLoading,
    setSearch: setResourceLookup,
  } = useAsyncMasterOptions('learning-resource', resourceParams);

  return (
    <ModulePageCard
      title="Course Finder"
      subtitle="Search courses and learning resources by country — data comes from Academic and Resources masters"
      icon={FiSearch}
      breadcrumbs={[
        { label: 'Admin', path: ROUTES.DASHBOARD },
        { label: 'Masters', path: ROUTES.MASTER },
        { label: 'Communication', path: `${ROUTES.MASTER}#master-communication` },
        { label: 'Course Finder' },
      ]}
      actions={
        <div className="flex flex-wrap gap-3">
          <MasterManageLink to="/admin/master/course">Manage Courses</MasterManageLink>
          <MasterManageLink to="/admin/master/learning-resource">Manage Learning Resources</MasterManageLink>
        </div>
      }
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <Card className="!p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Country"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              options={countryOptions}
              placeholder={countriesLoading ? 'Loading…' : 'All countries'}
              allowClear
              showSearch
            />
            <Input
              label="Search courses"
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value);
                setCourseLookup(e.target.value);
              }}
              placeholder="Type to search courses"
            />
            <Input
              label="Search resources"
              value={resourceSearch}
              onChange={(e) => {
                setResourceSearch(e.target.value);
                setResourceLookup(e.target.value);
              }}
              placeholder="Type to search resources"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="!p-4">
            <h3 className="text-sm font-semibold text-text mb-3">Courses</h3>
            {coursesLoading ? (
              <p className="text-xs text-text-muted">Searching…</p>
            ) : courseOptions.length === 0 ? (
              <p className="text-xs text-text-muted">No courses match. Add them under Academic → Course.</p>
            ) : (
              <ul className="space-y-2">
                {courseOptions.map((opt) => (
                  <li key={opt.value} className="rounded-lg border border-border px-3 py-2 text-sm text-text">
                    {opt.label}
                    {opt.code ? <span className="text-text-muted text-xs ml-2">{opt.code}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="!p-4">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiBookOpen className="w-4 h-4" /> Learning Resources
            </h3>
            {resourcesLoading ? (
              <p className="text-xs text-text-muted">Searching…</p>
            ) : resourceOptions.length === 0 ? (
              <p className="text-xs text-text-muted">No resources yet. Add them under Resources → Learning Resources.</p>
            ) : (
              <ul className="space-y-2">
                {resourceOptions.map((opt) => (
                  <li key={opt.value} className="rounded-lg border border-border px-3 py-2 text-sm text-text flex items-center justify-between gap-2">
                    <span>{opt.label}</span>
                    {opt.url ? (
                      <a href={opt.url} target="_blank" rel="noreferrer" className="text-primary">
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link to="/admin/master/learning-resource" className="text-xs text-primary">Open</Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </ModulePageCard>
  );
}
