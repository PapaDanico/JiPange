import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo-icon.webp"
          alt="JiPange"
          width={973}
          height={833}
          className="h-8 w-auto"
        />
        <span className="text-sm font-semibold text-primary">JiPange</span>
      </Link>
      <nav className="flex items-center gap-3">
        <Link href="/planners" className="text-xs font-medium text-primary underline">
          Planners
        </Link>
        <Link href="/tools" className="text-xs font-medium text-primary underline">
          Calculators
        </Link>
      </nav>
    </div>
  );
}
