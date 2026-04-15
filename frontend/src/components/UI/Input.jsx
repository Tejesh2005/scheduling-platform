export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`block w-full rounded-md border bg-[#1a1a1a] px-3 py-2 text-sm text-white shadow-sm transition-colors
          placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent
          ${error ? 'border-red-500' : 'border-[#333333]'}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}