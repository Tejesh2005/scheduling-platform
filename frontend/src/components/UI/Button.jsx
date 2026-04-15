export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-white text-[#0a0a0a] hover:bg-gray-200 focus:ring-white',
    secondary:
      'bg-[#1a1a1a] text-white border border-[#333333] hover:bg-[#222222] focus:ring-gray-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:
      'bg-transparent text-gray-400 hover:bg-[#1a1a1a] hover:text-white focus:ring-gray-500',
    outline:
      'bg-transparent text-white border border-[#333333] hover:bg-[#1a1a1a] focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}