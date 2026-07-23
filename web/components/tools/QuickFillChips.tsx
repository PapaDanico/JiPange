interface Props {
  label: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  current?: string;
}

export default function QuickFillChips({ label, options, onSelect, current }: Props) {
  return (
    <div className="mb-1 print:hidden">
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              current === opt.value
                ? "border-accent bg-accent text-ink"
                : "border-border bg-white text-primary hover:border-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
