import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <Link href="/" className="mb-6 flex items-center gap-2">
      <Image
        src="/logo-icon.webp"
        alt="JiPange"
        width={973}
        height={833}
        className="h-8 w-auto"
      />
      <span className="text-sm font-semibold text-primary">JiPange</span>
    </Link>
  );
}
