"use client";

import { useState } from "react";
import { WINDOW_START_DAY } from "@/lib/20th-challenge";

function buildIcs(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  // First occurrence: 15th of next month (or this month if we're before the 15th)
  const year = now.getDate() < WINDOW_START_DAY ? now.getFullYear() : now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = now.getDate() < WINDOW_START_DAY ? now.getMonth() + 1 : (now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
  const dateStr = `${year}${String(month).padStart(2, "0")}${String(WINDOW_START_DAY).padStart(2, "0")}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JiPange//20th Challenge Reminder//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    `DTSTAMP:${stamp}`,
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=15",
    "SUMMARY:JiPange 20th Challenge — check in now!",
    "DESCRIPTION:Your monthly savings check-in window is open (15th–25th). Visit jipangefinance.netlify.app/tools/20th-challenge to log your save and keep your streak alive.",
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:JiPange: time to check in your monthly save!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildGoogleUrl(): string {
  const now = new Date();
  const year = now.getDate() < WINDOW_START_DAY ? now.getFullYear() : now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = now.getDate() < WINDOW_START_DAY ? now.getMonth() + 1 : (now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
  const dateStr = `${year}${String(month).padStart(2, "0")}${String(WINDOW_START_DAY).padStart(2, "0")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "JiPange 20th Challenge — check in now!",
    details:
      "Your monthly savings check-in window is open (15th–25th). Visit jipangefinance.netlify.app/tools/20th-challenge to log your save.",
    dates: `${dateStr}/${dateStr}`,
    recur: "RRULE:FREQ=MONTHLY;BYMONTHDAY=15",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function CalendarReminderButton() {
  const [open, setOpen] = useState(false);

  function downloadIcs() {
    const blob = new Blob([buildIcs()], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jipange-20th-challenge.ics";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
      >
        📅 Set monthly reminder
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 text-sm space-y-3">
      <p className="font-semibold text-primary">Add a monthly reminder</p>
      <p className="text-xs text-[#4B4238]">
        Get a nudge on the {WINDOW_START_DAY}th of every month — the first day your check-in
        window opens.
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={buildGoogleUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          onClick={() => setOpen(false)}
        >
          Add to Google Calendar
        </a>
        <button
          type="button"
          onClick={downloadIcs}
          className="flex h-10 items-center justify-center rounded-xl border border-[#E5E0D8] px-4 text-sm font-medium text-primary hover:bg-[#F1ECE3]"
        >
          Download .ics (Apple / Outlook)
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#9A8B80]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
