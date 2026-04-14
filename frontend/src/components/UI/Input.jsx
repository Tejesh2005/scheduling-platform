export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}