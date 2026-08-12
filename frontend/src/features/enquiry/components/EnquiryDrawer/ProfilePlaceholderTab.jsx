export default function ProfilePlaceholderTab({ icon: Icon, title, description }) {
  return (
    <div className="crm-profile-placeholder">
      <div className="crm-profile-placeholder__icon">
        {Icon && <Icon className="w-6 h-6" strokeWidth={1.75} />}
      </div>
      <h3 className="crm-profile-placeholder__title">{title}</h3>
      <p className="crm-profile-placeholder__desc">{description}</p>
    </div>
  );
}
