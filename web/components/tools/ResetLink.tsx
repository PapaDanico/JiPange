export default function ResetLink({
  show,
  onReset,
  className = "",
}: {
  show: boolean;
  onReset: () => void;
  className?: string;
}) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onReset}
      className={`text-xs text-muted underline underline-offset-2 hover:text-primary ${className}`}
    >
      Start over
    </button>
  );
}
