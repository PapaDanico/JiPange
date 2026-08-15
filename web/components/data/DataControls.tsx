"use client";

import { useRef, useState } from "react";
import {
  backupFilename,
  clearAllData,
  exportSnapshot,
  importSnapshot,
} from "@/lib/backup";

type Notice = { tone: "success" | "danger"; text: string } | null;

/**
 * "Your data is yours", made literal: download everything as a file,
 * restore it on another device, or erase it all — entirely on-device,
 * nothing transmitted. The import path re-renders the whole app instantly
 * via the storage-change notification.
 */
export default function DataControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleExport() {
    const snapshot = exportSnapshot();
    if (!snapshot) {
      setNotice({ tone: "danger", text: "Nothing to back up yet — use a calculator or take the 90-second check first." });
      return;
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = backupFilename();
    anchor.click();
    URL.revokeObjectURL(url);
    const count = Object.keys(snapshot.data).length;
    setNotice({ tone: "success", text: `Backup downloaded — ${count} item${count === 1 ? "" : "s"}. Keep the file somewhere safe.` });
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const { restored } = importSnapshot(await file.text());
      setNotice({ tone: "success", text: `Restored ${restored} item${restored === 1 ? "" : "s"} — your plan is back.` });
    } catch (error) {
      setNotice({
        tone: "danger",
        text: error instanceof Error ? error.message : "That file couldn't be restored.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleClear() {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    const { removed } = clearAllData();
    setConfirmingClear(false);
    setNotice({ tone: "success", text: `Deleted ${removed} item${removed === 1 ? "" : "s"}. This device now holds no JiPange data.` });
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm print:hidden">
      <h2 className="text-base font-semibold text-primary">Your data, your file</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Everything JiPange knows lives on this device. Download it as a single
        file to keep or move to another device — nothing is ever uploaded.
      </p>

      {/* Three destructive-adjacent controls at 158 / 148 / 154px stacked into
          a phone column: near-equal, which reads as a mistake rather than as a
          choice. Equal width below sm:, intrinsic width once they share a row. */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 sm:w-auto text-sm font-medium text-white transition-colors hover:bg-primary-deep"
        >
          Download my data
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-primary px-5 sm:w-auto text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Restore from file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a JiPange backup file to restore"
          onChange={(event) => void handleImportFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={handleClear}
          onBlur={() => setConfirmingClear(false)}
          className={`inline-flex h-11 w-full items-center justify-center rounded-full px-5 sm:w-auto text-sm font-medium transition-colors ${
            confirmingClear
              ? "bg-danger text-white"
              : "border border-border text-faint hover:border-danger hover:text-danger"
          }`}
        >
          {confirmingClear ? "Tap again to erase everything" : "Delete everything"}
        </button>
      </div>

      <div aria-live="polite">
        {notice && (
          <p
            className={`mt-3 text-sm ${
              notice.tone === "success" ? "text-success" : "text-danger"
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>
    </div>
  );
}
