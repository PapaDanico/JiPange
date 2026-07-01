import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E0D8] px-6 py-6 text-center text-xs text-[#4B4238]">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
        <Link href="/terms" className="underline hover:text-primary">
          Terms of Use
        </Link>
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
      </div>
      <p className="mt-3">
        © {new Date().getFullYear()} JiPange. For guidance only — not licensed financial advice.
      </p>
    </footer>
  );
}
