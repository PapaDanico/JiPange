import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

export default function ToolLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <Link href="/tools" className="text-xs font-medium text-primary underline">
          ← All calculators
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-[#4B4238]">{description}</p>
      </div>
      <div className="mt-8 w-full max-w-md">{children}</div>
    </div>
  );
}
