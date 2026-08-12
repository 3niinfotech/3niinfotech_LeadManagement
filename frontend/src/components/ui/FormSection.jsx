export default function FormSection({ title, description, children, className = '' }) {
  return (
    <section className={`crm-form-section ${className}`}>
      {(title || description) && (
        <div className="crm-form-section__head">
          {title && <h3 className="crm-form-section__title">{title}</h3>}
          {description && <p className="crm-form-section__desc">{description}</p>}
        </div>
      )}
      <div className="crm-form-section__body">{children}</div>
    </section>
  );
}
