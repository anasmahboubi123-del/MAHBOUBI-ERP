export default function Card({
  children,
  className = '',
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white p-4 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
