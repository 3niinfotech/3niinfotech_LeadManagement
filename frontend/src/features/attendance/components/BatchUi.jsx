export function BatchMetric({ label, value, sub }) {
  return (
    <div className="crm-batch-metric">
      <p className="crm-batch-metric__label">{label}</p>
      <p className="crm-batch-metric__value">{value}</p>
      {sub ? <p className="crm-batch-metric__sub">{sub}</p> : null}
    </div>
  );
}

export function BatchDetailHero({ batch, summary, slots, sessionCount, instructorName }) {
  const avg = Number(summary?.averageAttendance) || 0;
  const atRisk = summary?.lowAttendanceStudents ?? 0;
  const students = summary?.totalStudents ?? 0;
  const tone = avg >= 75 ? 'success' : avg >= 50 ? 'warning' : students > 0 ? 'danger' : 'neutral';

  return (
    <div className="crm-batch-hero-wrap">
      <div className={`crm-batch-hero crm-batch-hero--${tone}`}>
        <div className="min-w-0 flex-1">
          <p className="crm-batch-hero__title">
            {students > 0 ? `${avg}% average attendance` : 'No attendance data yet'}
          </p>
          <p className="crm-batch-hero__detail">
            {students} enrolled
            {atRisk > 0 ? ` · ${atRisk} at risk` : ''}
            {batch.room ? ` · ${batch.room}` : ''}
            {instructorName ? ` · ${instructorName}` : ''}
          </p>
        </div>
        {students > 0 && (
          <div className="crm-batch-hero-capacity crm-batch-hero-capacity--inline">
            <div className="crm-batch-hero-capacity__track" aria-hidden>
              <div
                className={`crm-batch-hero-capacity__fill crm-batch-hero-capacity__fill--${tone}`}
                style={{ width: `${Math.min(100, Math.max(0, avg))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BatchWeekGrid({ slots, weekdays }) {
  const byDay = new Map((slots || []).map((s) => [s.dayOfWeek, s]));

  return (
    <div className="crm-batch-week" role="list" aria-label="Weekly timetable">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => {
        const slot = byDay.get(day);
        const label = weekdays[day]?.slice(0, 3) || weekdays[day];
        return (
          <div
            key={day}
            role="listitem"
            className={`crm-batch-week__cell ${slot ? 'crm-batch-week__cell--active' : ''}`}
          >
            <span className="crm-batch-week__day">{label}</span>
            {slot ? (
              <span className="crm-batch-week__time">{slot.startTime}–{slot.endTime}</span>
            ) : (
              <span className="crm-batch-week__empty">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
