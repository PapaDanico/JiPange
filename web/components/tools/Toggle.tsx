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
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        checked ? trackOn : "bg-[#D4CEC5]"
      }`}
    >
      {/* left-0 is load-bearing. Without it an absolute child of a <button>
          sits where the button centres its content, so the OFF knob rendered
          at the right edge — reading as ON — and the ON knob overflowed the
          track by 18px. 2px inset each side: 0.5 (2px) off, 22px on. */}
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
