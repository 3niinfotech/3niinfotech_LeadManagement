/** Lightweight section divider for master drawer forms — no card chrome */
export default function MasterFormSection({ title, children, className = '' }) {
  return (
    <section className={`crm-master-form-section ${title ? 'crm-master-form-section--titled' : ''} ${className}`.trim()}>
      {title ? <h3 className="crm-master-form-section__title">{title}</h3> : null}
      <div className="crm-master-form-section__body">{children}</div>
    </section>
  );
}
