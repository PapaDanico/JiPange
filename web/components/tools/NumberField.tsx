export default function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  min = 0,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#4B4238]">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[#4B4238]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
