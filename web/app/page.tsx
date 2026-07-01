import Link from "next/link";
import ReturningUserRedirect from "@/components/onboarding/ReturningUserRedirect";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <ReturningUserRedirect />
      <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
        JiPange
      </h1>
      <p className="mt-3 max-w-md text-lg text-[#4B4238]">
        The financial plan every Kenyan deserves — built for how we actually
        live.
      </p>
      <Link
        href="/profile"
        className="mt-8 inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-accent px-6 text-base font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
      >
        Start my plan — 90 seconds
      </Link>
    </div>
  );
}
