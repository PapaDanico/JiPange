interface Props {
  label: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  current?: string;
}

export default function QuickFillChips({ label, options, onSelect, current }: Props) {
  return (
    <div className="mb-1">
      <p className="mb-1.5 text-xs text-[#9A8B80]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              current === opt.value
                ? "border-accent bg-accent text-[#171717]"
                : "border-[#E5E0D8] bg-white text-primary hover:border-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
