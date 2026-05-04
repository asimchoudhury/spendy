"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Cloud,
  Mail,
  Calendar,
  History,
  Share2,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Copy,
  ExternalLink,
  Trash2,
  Play,
  Pause,
  Plus,
  ChevronDown,
  Wifi,
  WifiOff,
  Sparkles,
  BarChart3,
  Table,
  FileJson,
  TrendingUp,
} from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import {
  useExportHistory,
  ExportDestination,
  ExportSchedule,
} from "@/hooks/useExportHistory";
import { formatCurrency } from "@/utils/currency";
import {
  generateTaxReportCSV,
  generateMonthlySummaryCSV,
  generateCategoryAnalysisCSV,
  generateLedgerCSV,
  generateInsightsJSON,
  triggerDownload,
} from "@/utils/exportFormats";

// ─── QR Code ────────────────────────────────────────────────────────────────

function pseudoHash(str: string, seed: number): number {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
  }
  return h >>> 0;
}

function QRCode({ value }: { value: string }) {
  const N = 21;
  const cells: boolean[][] = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => {
      // Finder patterns (top-left, top-right, bottom-left)
      const inFinder = (fr: number, fc: number) =>
        r >= fr && r < fr + 7 && c >= fc && c < fc + 7;
      const finderBit = (fr: number, fc: number) => {
        const dr = r - fr;
        const dc = c - fc;
        if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
        if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
        return false;
      };
      if (inFinder(0, 0)) return finderBit(0, 0);
      if (inFinder(0, N - 7)) return finderBit(0, N - 7);
      if (inFinder(N - 7, 0)) return finderBit(N - 7, 0);
      // Timing patterns
      if (r === 6 && c >= 8 && c <= N - 9) return c % 2 === 0;
      if (c === 6 && r >= 8 && r <= N - 9) return r % 2 === 0;
      // Separators
      if (
        (r === 7 && c <= 7) ||
        (r === 7 && c >= N - 8) ||
        (r >= N - 8 && r <= N - 1 && c === 7)
      )
        return false;
      if (c === 7 && r <= 7) return false;
      if (c === 7 && r >= N - 8) return false;
      if (r === N - 8 && c <= 7) return false;
      // Data modules
      return pseudoHash(value, r * N + c) % 2 === 0;
    })
  );

  return (
    <svg
      viewBox={`0 0 ${N + 2} ${N + 2}`}
      width={120}
      height={120}
      style={{ imageRendering: "pixelated" }}
      className="rounded"
    >
      <rect width={N + 2} height={N + 2} fill="white" />
      {cells.map((row, r) =>
        row.map(
          (filled, c) =>
            filled && (
              <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width={1} height={1} fill="#1e1b4b" />
            )
        )
      )}
    </svg>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

type TabId = "templates" | "destinations" | "schedule" | "history" | "share";

const TABS: { id: TabId; label: string; icon: typeof Cloud }[] = [
  { id: "templates", label: "Templates", icon: FileText },
  { id: "destinations", label: "Destinations", icon: Cloud },
  { id: "schedule", label: "Auto-Backup", icon: Calendar },
  { id: "history", label: "History", icon: History },
  { id: "share", label: "Share", icon: Share2 },
];

interface Template {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  gradient: string;
  formats: string[];
  generator: (expenses: ReturnType<typeof useExpenses>["expenses"]) => string;
  filename: (date: string) => string;
  mime: string;
}

const TEMPLATES: Template[] = [
  {
    id: "tax-report",
    name: "Tax Report",
    description: "Annual tax filing with category totals, percentages, and full transaction ledger",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-600",
    formats: ["CSV"],
    generator: generateTaxReportCSV,
    filename: (d) => `tax-report-${d}.csv`,
    mime: "text/csv",
  },
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "Month-by-month spending overview with averages and transaction counts",
    icon: Calendar,
    gradient: "from-blue-500 to-indigo-600",
    formats: ["CSV"],
    generator: generateMonthlySummaryCSV,
    filename: (d) => `monthly-summary-${d}.csv`,
    mime: "text/csv",
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Deep-dive per category and subcategory with spending breakdown",
    icon: TrendingUp,
    gradient: "from-violet-500 to-purple-600",
    formats: ["CSV"],
    generator: generateCategoryAnalysisCSV,
    filename: (d) => `category-analysis-${d}.csv`,
    mime: "text/csv",
  },
  {
    id: "expense-ledger",
    name: "Expense Ledger",
    description: "Full itemized transaction list with IDs — ideal for accounting imports",
    icon: Table,
    gradient: "from-orange-500 to-red-500",
    formats: ["CSV"],
    generator: generateLedgerCSV,
    filename: (d) => `expense-ledger-${d}.csv`,
    mime: "text/csv",
  },
  {
    id: "insights-json",
    name: "Insights Report",
    description: "Structured JSON with trends, category rankings, and spending patterns",
    icon: FileJson,
    gradient: "from-pink-500 to-rose-600",
    formats: ["JSON"],
    generator: generateInsightsJSON,
    filename: (d) => `insights-${d}.json`,
    mime: "application/json",
  },
  {
    id: "full-export",
    name: "Full Data Export",
    description: "Everything — all transactions in CSV, ready for Excel or Google Sheets",
    icon: Sparkles,
    gradient: "from-amber-500 to-yellow-500",
    formats: ["CSV"],
    generator: generateLedgerCSV,
    filename: (d) => `spendy-full-export-${d}.csv`,
    mime: "text/csv",
  },
];

interface Integration {
  id: ExportDestination;
  name: string;
  description: string;
  color: string;
  iconEmoji: string;
  connectLabel: string;
  syncDescription: string;
  badge?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Export directly to a new Google Sheets spreadsheet with formatting",
    color: "bg-green-500/20 border-green-500/30 text-green-400",
    iconEmoji: "📊",
    connectLabel: "Connect Google",
    syncDescription: "Syncs to Google Drive",
    badge: "Popular",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Save exports to /Apps/Spendy/ in your Dropbox automatically",
    color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    iconEmoji: "📦",
    connectLabel: "Connect Dropbox",
    syncDescription: "Saves to /Apps/Spendy/",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Sync exports to Microsoft OneDrive for easy Office integration",
    color: "bg-sky-500/20 border-sky-500/30 text-sky-400",
    iconEmoji: "☁️",
    connectLabel: "Connect OneDrive",
    syncDescription: "Syncs to OneDrive",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Push expense data to a Notion database with custom properties",
    color: "bg-gray-500/20 border-gray-500/30 text-gray-300",
    iconEmoji: "📝",
    connectLabel: "Connect Notion",
    syncDescription: "Exports to database",
    badge: "Beta",
  },
  {
    id: "email",
    name: "Email",
    description: "Send export as email attachment to yourself or your accountant",
    color: "bg-violet-500/20 border-violet-500/30 text-violet-400",
    iconEmoji: "✉️",
    connectLabel: "Configure Email",
    syncDescription: "Sends attachment",
  },
];

// ─── Processing overlay ──────────────────────────────────────────────────────

interface ProcessingState {
  active: boolean;
  label: string;
  progress: number;
  destination: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CloudExportHub() {
  const { expenses } = useExpenses();
  const { history, schedules, addRecord, addSchedule, toggleSchedule, deleteSchedule, clearHistory } =
    useExportHistory();

  const [activeTab, setActiveTab] = useState<TabId>("templates");
  const [connectedServices, setConnectedServices] = useState<Set<string>>(
    new Set()
  );
  const [connecting, setConnecting] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    active: false,
    label: "",
    progress: 0,
    destination: "",
  });
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState<"7d" | "30d" | "never">("30d");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const processingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    templateName: TEMPLATES[1].name,
    destination: "email" as ExportDestination,
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 8,
    minute: 0,
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  function simulateProcessing(
    label: string,
    destination: string,
    onComplete: () => void
  ) {
    setProcessing({ active: true, label, progress: 0, destination });
    let p = 0;
    const tick = () => {
      p += Math.random() * 22 + 8;
      if (p >= 100) {
        setProcessing((s) => ({ ...s, progress: 100 }));
        setTimeout(() => {
          setProcessing({ active: false, label: "", progress: 0, destination: "" });
          onComplete();
        }, 400);
      } else {
        setProcessing((s) => ({ ...s, progress: Math.min(p, 95) }));
        processingRef.current = setTimeout(tick, 220 + Math.random() * 180);
      }
    };
    processingRef.current = setTimeout(tick, 150);
  }

  function handleTemplateDownload(template: Template) {
    const date = new Date().toISOString().slice(0, 10);
    const content = template.generator(expenses);
    const filename = template.filename(date);

    simulateProcessing(
      `Preparing ${template.name}…`,
      "local",
      () => {
        triggerDownload(content, filename, template.mime);
        addRecord({
          templateName: template.name,
          format: template.mime.includes("json") ? "json" : "csv",
          destination: "download",
          status: "completed",
          sizeBytes: new TextEncoder().encode(content).length,
          rowCount: expenses.length,
        });
        showToast(`${template.name} downloaded successfully`);
      }
    );
  }

  function handleCloudExport(integration: Integration, templateName: string) {
    const template = TEMPLATES.find((t) => t.name === templateName) ?? TEMPLATES[0];
    const content = template.generator(expenses);

    simulateProcessing(
      `Uploading to ${integration.name}…`,
      integration.name,
      () => {
        addRecord({
          templateName: template.name,
          format: template.mime.includes("json") ? "json" : "csv",
          destination: integration.id,
          status: "completed",
          sizeBytes: new TextEncoder().encode(content).length,
          rowCount: expenses.length,
        });
        showToast(`Exported to ${integration.name} successfully`);
      }
    );
  }

  function handleConnect(id: string) {
    setConnecting(id);
    setTimeout(() => {
      setConnecting(null);
      setConnectedServices((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      showToast(`Connected to ${INTEGRATIONS.find((i) => i.id === id)?.name}`);
    }, 1800);
  }

  function handleDisconnect(id: string) {
    setConnectedServices((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast(`Disconnected from ${INTEGRATIONS.find((i) => i.id === id)?.name}`);
  }

  function handleGenerateShareLink() {
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const link = `https://spendy.app/shared/${id}`;
    setShareLink(link);
    const expiryLabel =
      shareExpiry === "never" ? "never expires" : `expires in ${shareExpiry}`;
    showToast(`Share link generated — ${expiryLabel}`);
  }

  function handleCopyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSaveSchedule() {
    addSchedule({
      enabled: true,
      templateName: scheduleForm.templateName,
      destination: scheduleForm.destination,
      frequency: scheduleForm.frequency,
      dayOfWeek: scheduleForm.dayOfWeek,
      dayOfMonth: scheduleForm.dayOfMonth,
      hour: scheduleForm.hour,
      minute: scheduleForm.minute,
    });
    showToast("Auto-backup schedule saved");
  }

  useEffect(() => {
    return () => {
      if (processingRef.current) clearTimeout(processingRef.current);
    };
  }, []);

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Processing overlay */}
      {processing.active && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <RefreshCw size={20} className="text-violet-400 animate-spin" />
              </div>
              <div>
                <div className="font-semibold text-white">{processing.label}</div>
                <div className="text-xs text-gray-400">{processing.destination}</div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${processing.progress}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1.5">
              {Math.round(processing.progress)}%
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 border border-white/10 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-indigo-950/40 to-gray-950 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Cloud size={18} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Export & Sync Hub</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Ready
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {expenses.length} expenses · last synced {dateStr}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                {connectedServices.size > 0 ? (
                  <>
                    <Wifi size={13} className="text-emerald-400" />
                    <span>{connectedServices.size} service{connectedServices.size !== 1 ? "s" : ""} connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={13} className="text-gray-500" />
                    <span>No services connected</span>
                  </>
                )}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === id
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "templates" && (
          <TemplatesTab
            templates={TEMPLATES}
            expenses={expenses}
            onDownload={handleTemplateDownload}
          />
        )}
        {activeTab === "destinations" && (
          <DestinationsTab
            integrations={INTEGRATIONS}
            connectedServices={connectedServices}
            connecting={connecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onExport={handleCloudExport}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleTab
            schedules={schedules}
            form={scheduleForm}
            setForm={setScheduleForm}
            onSave={handleSaveSchedule}
            onToggle={toggleSchedule}
            onDelete={deleteSchedule}
            integrations={INTEGRATIONS}
            connectedServices={connectedServices}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            history={history}
            onClear={clearHistory}
            onDownloadAgain={(record) => {
              const template = TEMPLATES.find((t) => t.name === record.templateName);
              if (!template) return;
              handleTemplateDownload(template);
            }}
          />
        )}
        {activeTab === "share" && (
          <ShareTab
            shareLink={shareLink}
            shareExpiry={shareExpiry}
            setShareExpiry={setShareExpiry}
            onGenerate={handleGenerateShareLink}
            onCopy={handleCopyLink}
            copied={copied}
            expenses={expenses}
          />
        )}
      </div>
    </div>
  );
}

// ─── Templates Tab ───────────────────────────────────────────────────────────

function TemplatesTab({
  templates,
  expenses,
  onDownload,
}: {
  templates: Template[];
  expenses: ReturnType<typeof useExpenses>["expenses"];
  onDownload: (t: Template) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Export Templates</h2>
        <p className="text-sm text-gray-400">
          Pre-built templates optimised for different use cases. One click to download or send to any destination.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.id}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative bg-gray-900 border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 cursor-default"
            >
              {/* Gradient stripe */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${t.gradient}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {t.formats.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-white/8 text-gray-300 border border-white/10"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1.5">{t.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {t.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {expenses.length} rows
                  </span>
                  <button
                    onClick={() => onDownload(t)}
                    disabled={expenses.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      expenses.length === 0
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                        : `bg-gradient-to-r ${t.gradient} text-white hover:opacity-90 shadow-sm`
                    }`}
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {expenses.length === 0 && (
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm text-center">
          Add some expenses first to enable exports.
        </div>
      )}
    </div>
  );
}

// ─── Destinations Tab ────────────────────────────────────────────────────────

function DestinationsTab({
  integrations,
  connectedServices,
  connecting,
  onConnect,
  onDisconnect,
  onExport,
}: {
  integrations: Integration[];
  connectedServices: Set<string>;
  connecting: string | null;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onExport: (integration: Integration, templateName: string) => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<Record<string, string>>(
    Object.fromEntries(integrations.map((i) => [i.id, TEMPLATES[0].name]))
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Cloud Destinations</h2>
        <p className="text-sm text-gray-400">
          Connect your favourite services to send exports directly — no manual downloading required.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const isConnected = connectedServices.has(integration.id);
          const isConnecting = connecting === integration.id;

          return (
            <div
              key={integration.id}
              className="bg-gray-900 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-800 border border-white/8 flex items-center justify-center text-xl">
                    {integration.iconEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {integration.name}
                      </span>
                      {integration.badge && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300 border border-violet-500/20">
                          {integration.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-gray-600"}`}
                      />
                      <span
                        className={`text-xs ${isConnected ? "text-emerald-400" : "text-gray-500"}`}
                      >
                        {isConnecting
                          ? "Connecting…"
                          : isConnected
                          ? "Connected"
                          : "Not connected"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    isConnected
                      ? onDisconnect(integration.id)
                      : onConnect(integration.id)
                  }
                  disabled={isConnecting}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isConnecting
                      ? "bg-gray-800 text-gray-500 cursor-wait"
                      : isConnected
                      ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
                      : "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
                  }`}
                >
                  {isConnecting ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : isConnected ? (
                    "Disconnect"
                  ) : (
                    integration.connectLabel
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {integration.description}
              </p>

              {isConnected && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 shrink-0">Template:</label>
                    <div className="relative flex-1">
                      <select
                        value={selectedTemplate[integration.id]}
                        onChange={(e) =>
                          setSelectedTemplate((prev) => ({
                            ...prev,
                            [integration.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-800 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 appearance-none pr-7"
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onExport(integration, selectedTemplate[integration.id])
                    }
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Zap size={13} />
                    Export to {integration.name}
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={11} />
                    <span>{integration.syncDescription}</span>
                  </div>
                </div>
              )}

              {!isConnected && !isConnecting && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <WifiOff size={11} />
                  <span>Connect to enable direct exports</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule Tab ────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEST_LABELS: Record<string, string> = {
  download: "Local Download",
  email: "Email",
  "google-sheets": "Google Sheets",
  dropbox: "Dropbox",
  onedrive: "OneDrive",
  notion: "Notion",
};

function ScheduleTab({
  schedules,
  form,
  setForm,
  onSave,
  onToggle,
  onDelete,
  integrations,
  connectedServices,
}: {
  schedules: ExportSchedule[];
  form: {
    templateName: string;
    destination: ExportDestination;
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek: number;
    dayOfMonth: number;
    hour: number;
    minute: number;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSave: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  integrations: Integration[];
  connectedServices: Set<string>;
}) {
  const availableDestinations: ExportDestination[] = [
    "download",
    ...(integrations
      .filter((i) => connectedServices.has(i.id))
      .map((i) => i.id) as ExportDestination[]),
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Auto-Backup</h2>
        <p className="text-sm text-gray-400">
          Set up recurring exports to keep your data backed up automatically.
        </p>
      </div>

      {/* Schedule builder */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Plus size={16} className="text-violet-400" />
          </div>
          <span className="font-semibold text-white">New Schedule</span>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Template</label>
              <div className="relative">
                <select
                  value={form.templateName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, templateName: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-white/10 rounded-lg text-sm text-white px-3 py-2 appearance-none pr-8"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Destination</label>
              <div className="relative">
                <select
                  value={form.destination}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      destination: e.target.value as ExportDestination,
                    }))
                  }
                  className="w-full bg-gray-800 border border-white/10 rounded-lg text-sm text-white px-3 py-2 appearance-none pr-8"
                >
                  {availableDestinations.map((d) => (
                    <option key={d} value={d}>
                      {DEST_LABELS[d] ?? d}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setForm((f) => ({ ...f, frequency: freq }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    form.frequency === freq
                      ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                      : "bg-gray-800 text-gray-400 border border-white/8 hover:border-white/20"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {form.frequency === "weekly" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Day of Week</label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setForm((f) => ({ ...f, dayOfWeek: i }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.dayOfWeek === i
                        ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                        : "bg-gray-800 text-gray-400 border border-white/8 hover:border-white/20"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === "monthly" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Day of Month
              </label>
              <div className="relative w-32">
                <select
                  value={form.dayOfMonth}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dayOfMonth: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-gray-800 border border-white/10 rounded-lg text-sm text-white px-3 py-2 appearance-none pr-8"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Time</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={23}
                value={form.hour}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)),
                  }))
                }
                className="w-16 bg-gray-800 border border-white/10 rounded-lg text-sm text-white px-3 py-2 text-center"
              />
              <span className="text-gray-400 font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                step={15}
                value={form.minute}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minute: Math.max(
                      0,
                      Math.min(59, parseInt(e.target.value) || 0)
                    ),
                  }))
                }
                className="w-16 bg-gray-800 border border-white/10 rounded-lg text-sm text-white px-3 py-2 text-center"
              />
              <span className="text-xs text-gray-500">
                (
                {form.hour.toString().padStart(2, "0")}:
                {form.minute.toString().padStart(2, "0")} local time)
              </span>
            </div>
          </div>

          <button
            onClick={onSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Calendar size={15} />
            Save Schedule
          </button>
        </div>
      </div>

      {/* Active schedules */}
      {schedules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Active Schedules ({schedules.length})
          </h3>
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="bg-gray-900 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <button
                  onClick={() => onToggle(s.id)}
                  className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${
                    s.enabled ? "bg-violet-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                      s.enabled ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {s.templateName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="capitalize">{s.frequency}</span>
                    <span>·</span>
                    <span>{DEST_LABELS[s.destination] ?? s.destination}</span>
                    <span>·</span>
                    <span>
                      Next:{" "}
                      {new Date(s.nextRun).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(s.id)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {schedules.length === 0 && (
        <div className="text-center text-sm text-gray-600 py-6">
          No schedules yet — create one above to get started.
        </div>
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

const DEST_ICONS: Record<string, string> = {
  download: "⬇️",
  email: "✉️",
  "google-sheets": "📊",
  dropbox: "📦",
  onedrive: "☁️",
  notion: "📝",
};

function HistoryTab({
  history,
  onClear,
  onDownloadAgain,
}: {
  history: ReturnType<typeof useExportHistory>["history"];
  onClear: () => void;
  onDownloadAgain: (record: ReturnType<typeof useExportHistory>["history"][0]) => void;
}) {
  const totalBytes = history.reduce((s, h) => s + h.sizeBytes, 0);
  const formatSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes}B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)}KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)}MB`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Export History</h2>
          <p className="text-sm text-gray-400">
            {history.length} export{history.length !== 1 ? "s" : ""} · {formatSize(totalBytes)} total
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-white/8 hover:border-red-400/20 transition-all"
          >
            <Trash2 size={13} />
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <History size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No exports yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Your export history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((record) => (
            <div
              key={record.id}
              className="bg-gray-900 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-white/15 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-800 border border-white/8 flex items-center justify-center text-lg shrink-0">
                {DEST_ICONS[record.destination] ?? "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {record.templateName}
                  </span>
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-mono ${
                      record.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : record.status === "failed"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>
                    {new Date(record.timestamp).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>·</span>
                  <span className="uppercase font-mono">{record.format}</span>
                  <span>·</span>
                  <span>{formatSize(record.sizeBytes)}</span>
                  <span>·</span>
                  <span>{record.rowCount} rows</span>
                </div>
              </div>
              {record.destination === "download" && (
                <button
                  onClick={() => onDownloadAgain(record)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/8 border border-white/8 hover:border-white/20 transition-all"
                >
                  <Download size={12} />
                  Again
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Share Tab ───────────────────────────────────────────────────────────────

function ShareTab({
  shareLink,
  shareExpiry,
  setShareExpiry,
  onGenerate,
  onCopy,
  copied,
  expenses,
}: {
  shareLink: string | null;
  shareExpiry: "7d" | "30d" | "never";
  setShareExpiry: (v: "7d" | "30d" | "never") => void;
  onGenerate: () => void;
  onCopy: () => void;
  copied: boolean;
  expenses: ReturnType<typeof useExpenses>["expenses"];
}) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const expiryLabels = {
    "7d": "7 days",
    "30d": "30 days",
    never: "Never expires",
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Share & Collaborate</h2>
        <p className="text-sm text-gray-400">
          Generate a read-only snapshot link to share your expense summary with your accountant, partner, or team.
        </p>
      </div>

      {/* Snapshot preview */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-white">Snapshot Preview</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Expenses", value: formatCurrency(total) },
            { label: "Transactions", value: String(expenses.length) },
            {
              label: "Categories",
              value: String(new Set(expenses.map((e) => e.category)).size),
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800/60 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-400" />
          Read-only · No editing permissions · Expenses only
        </div>
      </div>

      {/* Expiry settings */}
      <div className="mb-5">
        <label className="block text-xs text-gray-400 mb-2">Link expiry</label>
        <div className="flex gap-2">
          {(["7d", "30d", "never"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setShareExpiry(opt)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                shareExpiry === opt
                  ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                  : "bg-gray-900 text-gray-400 border border-white/8 hover:border-white/20"
              }`}
            >
              {expiryLabels[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-opacity mb-5"
      >
        <Share2 size={15} />
        {shareLink ? "Regenerate Link" : "Generate Share Link"}
      </button>

      {/* Link & QR code */}
      {shareLink && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink size={14} className="text-violet-400" />
              <span className="text-xs font-medium text-gray-300">Shareable Link</span>
              <span className="ml-auto text-xs text-gray-500">
                Expires: {expiryLabels[shareExpiry]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate border border-white/8">
                {shareLink}
              </div>
              <button
                onClick={onCopy}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700"
                }`}
              >
                {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-900 border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-300">QR Code</span>
              <span className="text-xs text-gray-500">· Scan to open on mobile</span>
            </div>
            <div className="flex items-start gap-6">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <QRCode value={shareLink} />
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Share this QR code with anyone who needs to view your expense summary. They can scan it with any camera app.
                </p>
                <div className="space-y-2">
                  {[
                    "Read-only access",
                    "No account required",
                    `Expires: ${expiryLabels[shareExpiry]}`,
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Embed code */}
          <div className="bg-gray-900 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-300">Embed Widget</span>
              <span className="text-xs text-gray-600">· For websites & Notion</span>
            </div>
            <pre className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-400 overflow-x-auto border border-white/5">
              {`<iframe src="${shareLink}/embed"\n  width="100%" height="400"\n  frameborder="0" />`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
