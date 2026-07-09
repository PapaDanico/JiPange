interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  "aria-label"?: string;
  activeColor?: "primary" | "success";
}

export default function Toggle({
  checked,
  onChange,
  "aria-label": ariaLabel,
  activeColor = "primary",
}: ToggleProps) {
  const trackOn = activeColor === "success" ? "bg-success" : "bg-primary";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? trackOn : "bg-[#D4CEC5]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
