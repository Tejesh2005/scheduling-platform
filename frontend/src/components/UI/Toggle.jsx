// FILE: src/components/UI/Toggle.jsx

export default function Toggle({ enabled, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-[22px] w-[40px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/10 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] ${
          enabled ? 'bg-[#e0e0e0]' : 'bg-[#333333]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out mt-[2px] ${
            enabled
              ? 'translate-x-[20px] bg-[#111111] ml-0'
              : 'translate-x-[2px] bg-[#666666]'
          }`}
        />
      </button>
      {label && <span className="text-sm text-[#a0a0a0]">{label}</span>}
    </label>
  );
}