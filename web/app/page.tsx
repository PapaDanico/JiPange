import Image from "next/image";
import Link from "next/link";
import ResumeToast from "@/components/onboarding/ResumeToast";
import ReturningUserRedirect from "@/components/onboarding/ReturningUserRedirect";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <ResumeToast />
      <ReturningUserRedirect />
      <Image
        src="/logo-lockup.webp"
        alt="JiPange"
        width={1131}
        height={609}
        priority
        className="h-auto w-64 sm:w-72"
      />
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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <Link href="/planners" className="font-medium text-primary underline">
          Goal planners
        </Link>
        <span aria-hidden="true" className="text-[#C9BFB2]">
          ·
        </span>
        <Link href="/tools" className="font-medium text-primary underline">
          Free calculators
        </Link>
      </div>
    </div>
  );
}
