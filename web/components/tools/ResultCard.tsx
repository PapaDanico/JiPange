export default function ResultCard({
  label,
  value,
  sublabel,
  tone = "primary",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-[#4B4238]">{label}</p>
      <p className={`mt-1 break-words text-2xl font-semibold sm:text-3xl ${toneClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-[#4B4238]">{sublabel}</p>}
    </div>
  );
}
