import MoneyPicture from "@/components/onboarding/MoneyPicture";

export default function PicturePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-primary">Your Kenya Money Picture</h1>
        <p className="mt-1 text-sm text-[#4B4238]">
          Calculated instantly from your profile — no extra input needed.
        </p>
      </div>
      <div className="mt-8 flex w-full justify-center">
        <MoneyPicture />
      </div>
    </div>
  );
}
