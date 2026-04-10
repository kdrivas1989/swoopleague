"use client";

import { useState } from "react";

interface RegistrationPreview {
  orderId: number;
  email: string;
  name: string;
  country: string;
  wcProductName: string;
  eventType: string;
  membership: string;
  compClass: string;
  wingType: string;
  wingSize: string;
  wingLoading: string;
  degreeOfTurn: string;
  priceCents: number;
  localEventId: number | null;
  localEventName: string | null;
  alreadyExists: boolean;
  unmapped: boolean;
}

interface PreviewData {
  registrations: RegistrationPreview[];
  summary: {
    total: number;
    new: number;
    existing: number;
    unmapped: number;
  };
}

interface ImportResult {
  success: boolean;
  imported: number;
  skippedExisting: number;
  skippedUnmapped: number;
  errors: string[];
  total: number;
}

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/wc-import");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch WooCommerce data");
    } finally {
      setLoading(false);
    }
  };

  const doImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wc-import", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            WooCommerce Import
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Import 2026 registrations from swoopleague.com
          </p>
        </div>
        <button
          onClick={fetchPreview}
          disabled={loading}
          className="px-4 py-2 bg-[var(--accent-cyan)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch from WooCommerce"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-300">
          {error}
        </div>
      )}

      {importResult && (
        <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-300">
          <p className="font-semibold mb-2">Import Complete</p>
          <ul className="text-sm space-y-1">
            <li>Imported: {importResult.imported}</li>
            <li>Skipped (already exists): {importResult.skippedExisting}</li>
            <li>Skipped (no matching event): {importResult.skippedUnmapped}</li>
            <li>Total orders processed: {importResult.total}</li>
          </ul>
          {importResult.errors.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold text-red-300">Errors:</p>
              <ul className="text-xs text-red-400 mt-1 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {preview && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {preview.summary.total}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-xs text-gray-400">New</p>
              <p className="text-2xl font-bold text-green-400">
                {preview.summary.new}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-xs text-gray-400">Already Exists</p>
              <p className="text-2xl font-bold text-yellow-400">
                {preview.summary.existing}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]">
              <p className="text-xs text-gray-400">Unmapped</p>
              <p className="text-2xl font-bold text-red-400">
                {preview.summary.unmapped}
              </p>
            </div>
          </div>

          {/* Import button */}
          {preview.summary.new > 0 && (
            <div className="mb-6">
              <button
                onClick={doImport}
                disabled={importing}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {importing
                  ? "Importing..."
                  : `Import ${preview.summary.new} New Registration${preview.summary.new !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Name
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Email
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Event
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Class
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Wing
                  </th>
                  <th className="text-left p-3 text-gray-400 font-medium">
                    Country
                  </th>
                  <th className="text-right p-3 text-gray-400 font-medium">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.registrations.map((reg, i) => (
                  <tr
                    key={`${reg.orderId}-${reg.wcProductName}-${i}`}
                    className={`border-b border-[var(--card-border)] last:border-0 ${
                      reg.alreadyExists
                        ? "opacity-50"
                        : reg.unmapped
                        ? "bg-red-900/10"
                        : ""
                    }`}
                  >
                    <td className="p-3">
                      {reg.alreadyExists ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-400">
                          exists
                        </span>
                      ) : reg.unmapped ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-400">
                          no event
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-400">
                          new
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[var(--foreground)]">{reg.name}</td>
                    <td className="p-3 text-gray-400">{reg.email}</td>
                    <td className="p-3 text-[var(--foreground)]">
                      {reg.localEventName || reg.wcProductName}
                    </td>
                    <td className="p-3 text-gray-300">{reg.compClass || "-"}</td>
                    <td className="p-3 text-gray-300">
                      {reg.wingType
                        ? `${reg.wingType} ${reg.wingSize || ""}`
                        : "-"}
                    </td>
                    <td className="p-3 text-gray-300">{reg.country || "-"}</td>
                    <td className="p-3 text-right text-gray-400">
                      #{reg.orderId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!preview && !importResult && !loading && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No data loaded</p>
          <p className="text-sm">
            Click &quot;Fetch from WooCommerce&quot; to preview registrations
            before importing.
          </p>
        </div>
      )}
    </div>
  );
}
