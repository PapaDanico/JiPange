export default function DeductionRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? "font-semibold text-primary" : "text-[#4B4238]"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
