"use client"

import { useUser } from "@clerk/nextjs"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  RefreshCw,
  Users,
  Building2,
  CalendarDays,
  Target,
  TrendingUp,
  Activity,
  Link2,
  Briefcase,
  Trophy,
  Medal,
  Award,
} from "lucide-react"

import { getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"
import type { AnalyticsData, CompanyRankEntry } from "@/app/api/admin/analytics/route"

// ─── Date utilities ────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function initDateFrom() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return toDateStr(d)
}

function initDateTo() {
  return toDateStr(new Date())
}

const PRESETS = [
  { key: "30d", label: "30d" },
  { key: "3m", label: "3m" },
  { key: "6m", label: "6m" },
  { key: "1y", label: "1yr" },
  { key: "all", label: "All" },
] as const

type PresetKey = typeof PRESETS[number]["key"]

function presetDates(key: PresetKey): { from: string; to: string } {
  const today = new Date()
  const to = toDateStr(today)
  switch (key) {
    case "30d": { const d = new Date(today); d.setDate(d.getDate() - 30); return { from: toDateStr(d), to } }
    case "3m":  { const d = new Date(today); d.setMonth(d.getMonth() - 3); return { from: toDateStr(d), to } }
    case "6m":  { const d = new Date(today); d.setMonth(d.getMonth() - 6); return { from: toDateStr(d), to } }
    case "1y":  { const d = new Date(today); d.setFullYear(d.getFullYear() - 1); return { from: toDateStr(d), to } }
    case "all": return { from: "2020-01-01", to }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


// Builds a label formatter for bucket index keys ("0"–"11") based on the epoch range.
function makeBucketFormatter(rangeFrom: string, bucketMs: number): (key: string) => string {
  const startMs = new Date(rangeFrom + "T00:00:00.000Z").getTime()
  return (key: string): string => {
    const idx = Number(key)
    if (Number.isNaN(idx)) return key
    const t = new Date(startMs + idx * bucketMs)
    if (bucketMs < 86400000) {
      return (
        t.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " + t.toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
      )
    }
    if (bucketMs < 86400000 * 28) {
      return t.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    }
    if (bucketMs < 86400000 * 365) {
      return t.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
    }
    return String(t.getUTCFullYear())
  }
}

function bucketGranularity(bucketMs: number): string {
  if (bucketMs < 3600000)        return `${Math.round(bucketMs / 60000)}-min intervals`
  if (bucketMs < 86400000)       return `${Math.round(bucketMs / 3600000)}-hour intervals`
  const days = Math.round(bucketMs / 86400000)
  if (days === 1)                return "Daily"
  if (days < 28)                 return `${days}-day intervals`
  if (days < 60)                 return "Monthly"
  if (days < 400)                return `${Math.round(days / 30)}-month intervals`
  return `${Math.round(days / 365)}-year intervals`
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function rangeDisplayLabel(from: string, to: string) {
  const fmt = (d: string) => {
    const date = new Date(d + "T12:00:00Z")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
  return `${fmt(from)} – ${fmt(to)}`
}

const CHART_COLORS = {
  indigo: "#818cf8",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#f87171",
  blue: "#60a5fa",
  violet: "#a78bfa",
  sky: "#38bdf8",
}

const SOURCE_COLORS: Record<string, string> = {
  manual: CHART_COLORS.indigo,
  scanner: CHART_COLORS.emerald,
  unknown: CHART_COLORS.amber,
}

// ─── Recharts custom tooltip ───────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatLabel }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatLabel?: (l: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/20 bg-black/85 px-3 py-2 text-sm shadow-xl backdrop-blur">
      <p className="mb-1.5 text-xs text-white/50">{formatLabel ? formatLabel(label ?? "") : (label ?? "")}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium text-white">
          <span style={{ color: p.color }} className="mr-1.5">●</span>
          {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl border border-white/20 bg-black/85 px-3 py-2 text-sm shadow-xl backdrop-blur">
      <p className="mb-0.5 capitalize text-white/60">{p.name}</p>
      <p className="font-semibold text-white">{p.value.toLocaleString()}</p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  loading,
}: {
  label: string
  value: number
  hint: string
  icon: React.ElementType
  accent: string
  loading: boolean
}) {
  return (
    <div className={`rounded-2xl border border-foreground/10 bg-linear-to-br ${accent} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {loading ? "—" : value.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 bg-foreground/10 p-2 text-foreground/80">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-foreground/65">{hint}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">{subtitle ?? "Chart"}</p>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="h-60 animate-pulse rounded-xl border border-dashed border-foreground/10 bg-foreground/5" />
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={16} className="text-amber-400" />
  if (rank === 2) return <Medal size={16} className="text-slate-400" />
  if (rank === 3) return <Award size={16} className="text-amber-700" />
  return <span className="text-sm font-medium tabular-nums text-foreground/50">{rank}</span>
}

function ShareBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right text-xs tabular-nums text-foreground/70">
        {percentage.toFixed(1)}%
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-400 transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useUser()
  const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
  const { canView } = getManagementPageAccessState(metadata, "manage", ["/analytics", "analytics"])

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState(initDateFrom)
  const [dateTo, setDateTo] = useState(initDateTo)
  const [activePreset, setActivePreset] = useState<PresetKey | "">( "1y")

  // Stable initial dates to seed the first load without stale-closure issues
  const initRef = useRef({ from: dateFrom, to: dateTo })

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from, to })
      const res = await fetch(`/api/admin/analytics?${params}`, { cache: "no-store" })
      const payload = await res.json()
      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Failed to load analytics")
      setData(payload.data as AnalyticsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(initRef.current.from, initRef.current.to)
  }, [load])

  const applyPreset = (key: PresetKey) => {
    const { from, to } = presetDates(key)
    setDateFrom(from)
    setDateTo(to)
    setActivePreset(key)
    void load(from, to)
  }

  const handleApply = () => {
    setActivePreset("")
    void load(dateFrom, dateTo)
  }

  const rangeLabel = useMemo(
    () => (dateFrom && dateTo ? rangeDisplayLabel(dateFrom, dateTo) : ""),
    [dateFrom, dateTo]
  )

  const bucketFormatter = useMemo((): (key: string) => string => {
    if (!data?.rangeFrom || !data?.bucketMs) return (k) => k
    return makeBucketFormatter(data.rangeFrom, data.bucketMs)
  }, [data?.rangeFrom, data?.bucketMs])

  const granularity = data ? bucketGranularity(data.bucketMs) : ""

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white/80">
          You do not have access to this page.
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      label: "Users Registered",
      value: data?.totalUsers ?? 0,
      hint: `${data?.regularUsers ?? 0} members · ${data?.adminUsers ?? 0} admins`,
      icon: Users,
      accent: "from-cyan-400/25 to-cyan-400/5",
    },
    {
      label: "Companies Added",
      value: data?.totalCompanies ?? 0,
      hint: "New company records in period",
      icon: Building2,
      accent: "from-emerald-400/25 to-emerald-400/5",
    },
    {
      label: "Check-ins",
      value: data?.totalCheckIns ?? 0,
      hint: (() => {
        const sources = data?.checkInSources ?? []
        const manual = sources.find((s) => s.source === "manual")?.count ?? 0
        const scanner = sources.find((s) => s.source === "scanner")?.count ?? 0
        return `${manual} manual · ${scanner} scanner`
      })(),
      icon: Activity,
      accent: "from-violet-400/25 to-violet-400/5",
    },
    {
      label: "Sessions",
      value: data?.totalSessions ?? 0,
      hint: `${data?.upcomingSessions ?? 0} upcoming within range`,
      icon: CalendarDays,
      accent: "from-amber-400/25 to-amber-400/5",
    },
    {
      label: "Mission Completions",
      value: data?.totalMissionCompletions ?? 0,
      hint: `Across ${data?.totalMissions ?? 0} total missions`,
      icon: Target,
      accent: "from-rose-400/25 to-rose-400/5",
    },
    {
      label: "Attendance Records",
      value: data?.totalAttendance ?? 0,
      hint: "Attendance logs in period",
      icon: TrendingUp,
      accent: "from-sky-400/25 to-sky-400/5",
    },
  ]

  return (
    <div className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        {/* ── Header ── */}
        <section className="rounded-[2rem] border border-foreground/10 bg-linear-to-br from-foreground/10 via-foreground/5 to-transparent p-6 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-foreground/70">
                <Activity size={12} /> Read-only · live data
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Analytics</h1>
              <p className="text-sm leading-6 text-foreground/70 sm:text-base">
                Aggregated metrics across users, companies, check-ins, missions, attendance, and sessions.
                {rangeLabel && (
                  <span className="ml-1 font-medium text-foreground/90">{rangeLabel}</span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {/* Date range control */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Preset chips */}
                <div className="flex items-center gap-0.5 rounded-xl border border-foreground/10 bg-foreground/5 p-1">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.key)}
                      disabled={loading}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        activePreset === preset.key
                          ? "bg-foreground/20 text-foreground shadow-sm"
                          : "text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom date inputs */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setActivePreset("")
                    }}
                    className="rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground/30"
                  />
                  <span className="text-xs text-foreground/40">–</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={toDateStr(new Date())}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setActivePreset("")
                    }}
                    className="rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground/30"
                  />
                </div>

                {/* Apply / Refresh button */}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground/10 disabled:opacity-60"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  {activePreset === "" ? "Apply" : "Refresh"}
                </button>
              </div>

              {data && (
                <span className="text-xs text-foreground/40">
                  Updated {formatDateTime(data.lastUpdated)}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {/* KPI grid */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </section>

        {/* ── Profile completeness (current state, no range filter) ── */}
        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Resume Uploaded", value: data?.usersWithPortfolio ?? 0, icon: Link2, color: "text-indigo-400" },
            { label: "Social links added", value: data?.usersWithSocialLinks ?? 0, icon: Briefcase, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl border border-white/10 bg-white/5 p-2 ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs text-foreground/50">{label} <span className="text-foreground/30">(all-time)</span></p>
                  <p className="text-xl font-semibold">
                    {loading ? "—" : value.toLocaleString()}
                    {!loading && data && (
                      <span className="ml-2 text-sm font-normal text-foreground/50">
                        / {data.totalUsers} users
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Row 1: User regs + Check-ins over time ── */}
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="User Registrations" subtitle={`${granularity} · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data?.usersByMonth ?? []} margin={{ top: 4, right: 8, bottom: 48, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                  <XAxis dataKey="month" tickFormatter={bucketFormatter} tick={{ fill: "#9ca3af", fontSize: 11, angle: -45, textAnchor: "end", dy: 4 }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip formatLabel={bucketFormatter} />} />
                  <Line type="monotone" dataKey="count" name="New users" stroke={CHART_COLORS.indigo} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLORS.indigo }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Check-ins Over Time" subtitle={`${granularity} · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.checkInsByMonth ?? []} margin={{ top: 4, right: 8, bottom: 48, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={bucketFormatter} tick={{ fill: "#9ca3af", fontSize: 11, angle: -45, textAnchor: "end", dy: 4 }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip formatLabel={bucketFormatter} />} />
                  <Bar dataKey="count" name="Check-ins" fill={CHART_COLORS.violet} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* ── Row 2: Attendance + Mission completions ── */}
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Attendance" subtitle={`${granularity} · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.attendanceByMonth ?? []} margin={{ top: 4, right: 8, bottom: 48, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={bucketFormatter} tick={{ fill: "#9ca3af", fontSize: 11, angle: -45, textAnchor: "end", dy: 4 }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip formatLabel={bucketFormatter} />} />
                  <Bar dataKey="count" name="Attendance" fill={CHART_COLORS.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Mission Completions" subtitle={`${granularity} · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data?.missionCompletionsByMonth ?? []} margin={{ top: 4, right: 8, bottom: 48, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                  <XAxis dataKey="month" tickFormatter={bucketFormatter} tick={{ fill: "#9ca3af", fontSize: 11, angle: -45, textAnchor: "end", dy: 4 }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip formatLabel={bucketFormatter} />} />
                  <Line type="monotone" dataKey="count" name="Completions" stroke={CHART_COLORS.rose} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLORS.rose }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* ── Row 3: Check-in sources + Top missions ── */}
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Check-in Sources" subtitle={`Distribution · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data?.checkInSources ?? []}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {(data?.checkInSources ?? []).map((entry) => (
                        <Cell
                          key={entry.source}
                          fill={SOURCE_COLORS[entry.source] ?? CHART_COLORS.amber}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-xs capitalize text-foreground/70">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full space-y-3 sm:w-48">
                  {(data?.checkInSources ?? []).map((s) => (
                    <div key={s.source} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs capitalize text-foreground/50">{s.source}</p>
                      <p className="mt-0.5 text-xl font-semibold">{s.count.toLocaleString()}</p>
                      <p className="text-xs text-foreground/40">
                        {data && data.totalCheckIns > 0
                          ? ((s.count / data.totalCheckIns) * 100).toFixed(1) + "%"
                          : "0%"}
                      </p>
                    </div>
                  ))}
                  {(data?.checkInSources ?? []).length === 0 && (
                    <p className="text-sm text-foreground/40">No check-ins in this period</p>
                  )}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Top 10 Missions" subtitle={`By completion count · ${rangeLabel}`}>
            {loading ? <SkeletonChart /> : (data?.topMissions ?? []).length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-foreground/40">
                No mission completions in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(240, (data?.topMissions.length ?? 0) * 34)}>
                <BarChart
                  layout="vertical"
                  data={data?.topMissions ?? []}
                  margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="missionTitle"
                    type="category"
                    width={160}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 21) + "…" : v}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]
                      return (
                        <div className="rounded-xl border border-white/20 bg-black/85 px-3 py-2 text-sm shadow-xl backdrop-blur">
                          <p className="mb-1 text-xs text-white/50">{(p.payload as { missionTitle: string }).missionTitle}</p>
                          <p className="font-semibold text-white">{Number(p.value).toLocaleString()} completions</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" name="Completions" fill={CHART_COLORS.rose} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        {/* ── Company Ranking Table ── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 p-5 pb-0">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Rankings · {rangeLabel}</p>
              <h3 className="mt-1 text-lg font-semibold">Company Check-in Leaderboard</h3>
              <p className="mt-0.5 text-sm text-foreground/50">All companies ranked by check-ins in the selected period</p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5 pt-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-foreground/40">
                    <th className="px-5 py-3 w-12">Rank</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3 text-right w-28 text-nowrap">Check-ins</th>
                    <th className="px-5 py-3 text-right w-32 text-nowrap">Unique users</th>
                    <th className="px-5 py-3 w-48 text-nowrap">Share of total</th>
                    <th className="px-5 py-3 w-36 hidden lg:table-cell text-nowrap">First check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.companyRanking ?? []).map((entry: CompanyRankEntry) => (
                    <tr
                      key={entry.companyId}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${entry.rank <= 3 ? "bg-white/[0.02]" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center w-6">
                          <RankBadge rank={entry.rank} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-medium ${entry.rank <= 3 ? "text-foreground" : "text-foreground/80"}`}>
                          {entry.companyName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        <span className={entry.checkInCount > 0 ? "text-foreground" : "text-foreground/30"}>
                          {entry.checkInCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-foreground/70">
                        {entry.uniqueUsers.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <ShareBar percentage={entry.percentage} />
                      </td>
                      <td className="hidden px-5 py-3.5 text-foreground/50 lg:table-cell text-right">
                        {formatDate(entry.firstCheckIn)}
                      </td>
                    </tr>
                  ))}
                  {(data?.companyRanking ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-foreground/40">
                        No company data yet
                      </td>
                    </tr>
                  )}
                </tbody>
                {data && data.totalCheckIns > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/10 text-foreground/40">
                      <td colSpan={2} className="px-5 py-3 text-xs">
                        {data.companyRanking.filter((c) => c.checkInCount > 0).length} of {data.companyRanking.length} companies have check-ins in this period
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-xs">
                        {data.totalCheckIns.toLocaleString()}
                      </td>
                      <td colSpan={3} className="px-5 py-3 text-xs">total</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </section>

        {/* ── Footer note ── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs text-foreground/40 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur">
          This page is read-only. All figures are pulled directly from the database and reflect the state at the time of the last refresh.
          Time-series charts and KPI counts cover the selected date range. Profile completeness stats reflect all-time user state.
          The leaderboard includes all registered companies, including those with zero check-ins in the selected period.
        </section>

      </div>
    </div>
  )
}
