export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={`
        bg-card-bg border border-card-border rounded-lg shadow-card
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
