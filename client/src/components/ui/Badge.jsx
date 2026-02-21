export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}
