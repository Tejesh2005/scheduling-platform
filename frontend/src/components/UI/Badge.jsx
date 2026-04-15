export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[#1a1a1a] text-gray-400 border border-[#333333]',
    success: 'bg-green-900/30 text-green-400 border border-green-800/50',
    warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50',
    danger: 'bg-red-900/30 text-red-400 border border-red-800/50',
    info: 'bg-blue-900/30 text-blue-400 border border-blue-800/50',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}