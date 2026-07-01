"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES } from "@/lib/counties";
import { calculateNetPay } from "@/lib/tax";
import { formatKES } from "@/lib/budget";
import { profileSchema, type Profile } from "@/lib/types";
import { setStoredProfile } from "@/lib/storage";

interface FormState {
  fullName: string;
  age: string;
  county: string;
  grossMonthlySalary: string;
  dependants: string;
  chamaMember: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  age: "",
  county: "Nairobi",
  grossMonthlySalary: "",
  dependants: "0",
  chamaMember: false,
};

export default function ProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [debouncedSalary, setDebouncedSalary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSalary(form.grossMonthlySalary);
    }, 300);
    return () => clearTimeout(handle);
  }, [form.grossMonthlySalary]);

  const previewNet = useMemo(() => {
    const gross = Number(debouncedSalary);
    if (!gross || gross <= 0) return null;
    return calculateNetPay(gross);
  }, [debouncedSalary]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const candidate = {
      fullName: form.fullName.trim(),
      age: Number(form.age),
      county: form.county,
      grossMonthlySalary: Number(form.grossMonthlySalary),
      dependants: Number(form.dependants),
      chamaMember: form.chamaMember,
    };

    const result = profileSchema.safeParse(candidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setStoredProfile(result.data as Profile);
    router.push("/picture");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-[#4B4238]">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. Wanjiru Kamau"
        />
        {errors.fullName && <p className="mt-1 text-sm text-danger">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium text-[#4B4238]">
          Age
        </label>
        <input
          id="age"
          type="number"
          inputMode="numeric"
          min={18}
          max={80}
          value={form.age}
          onChange={(event) => updateField("age", event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. 29"
        />
        {errors.age && <p className="mt-1 text-sm text-danger">{errors.age}</p>}
      </div>

      <div>
        <label htmlFor="county" className="block text-sm font-medium text-[#4B4238]">
          County
        </label>
        <select
          id="county"
          value={form.county}
          onChange={(event) => updateField("county", event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {KENYA_COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="grossMonthlySalary" className="block text-sm font-medium text-[#4B4238]">
          Monthly gross salary (KES)
        </label>
        <input
          id="grossMonthlySalary"
          type="number"
          inputMode="numeric"
          min={0}
          value={form.grossMonthlySalary}
          onChange={(event) => updateField("grossMonthlySalary", event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. 80000"
        />
        {errors.grossMonthlySalary && (
          <p className="mt-1 text-sm text-danger">{errors.grossMonthlySalary}</p>
        )}
        {previewNet && (
          <p className="mt-2 rounded-lg bg-[#F1ECE3] px-4 py-3 text-sm text-primary">
            Estimated take-home pay:{" "}
            <span className="font-semibold">{formatKES(previewNet.netMonthly)}</span> /month
          </p>
        )}
      </div>

      <div>
        <label htmlFor="dependants" className="block text-sm font-medium text-[#4B4238]">
          Number of dependants
        </label>
        <input
          id="dependants"
          type="number"
          inputMode="numeric"
          min={0}
          value={form.dependants}
          onChange={(event) => updateField("dependants", event.target.value)}
          className="mt-1 h-12 w-full rounded-lg border border-[#E5E0D8] bg-white px-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-[#4B4238]">
          Do you contribute to a Chama or SACCO?
        </span>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => updateField("chamaMember", true)}
            className={`h-12 flex-1 rounded-full border text-base font-medium transition-colors ${
              form.chamaMember
                ? "border-accent bg-accent text-[#171717]"
                : "border-[#E5E0D8] bg-white text-[#4B4238]"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => updateField("chamaMember", false)}
            className={`h-12 flex-1 rounded-full border text-base font-medium transition-colors ${
              !form.chamaMember
                ? "border-accent bg-accent text-[#171717]"
                : "border-[#E5E0D8] bg-white text-[#4B4238]"
            }`}
          >
            No
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="h-12 w-full rounded-full bg-primary text-base font-medium text-white transition-colors hover:bg-[#584a3e]"
      >
        See my Pesa Picture →
      </button>
    </form>
  );
}
