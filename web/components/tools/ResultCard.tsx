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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-[#4B4238]">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${toneClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-[#4B4238]">{sublabel}</p>}
    </div>
  );
}
