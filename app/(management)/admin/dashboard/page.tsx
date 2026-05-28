"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Building2,
  Users,
  ShieldCheck,
  Layers3,
  RefreshCw,
  Sparkles,
  Plus,
  Clock3,
} from "lucide-react"

type DashboardStats = {
  registeredUsers: number
  totalUsers: number
  adminUsers: number
  dataUsers: number
  companies: number
  sessions: number
  upcomingSessions: number
  logoLoop: number
  recentUsers: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
  recentSessions: Array<{
    id: string
    title: string
    date: string
    companyId: string
    linkCount: number
  }>
  recentCompanies: Array<{
    id: string
    name: string
    description: string
    createdAt: string
  }>
  lastUpdated: string
}

type DashboardResponse =
  | { success: true; data: DashboardStats }
  | { success: false; error: string }

const statCardClass =
  "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur"

function formatDateTime(value: string) {
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      })
      const contentType = response.headers.get("content-type") || ""
      const responseText = await response.text()

      const payload = contentType.includes("application/json")
        ? (JSON.parse(responseText) as DashboardResponse)
        : null

      if (!response.ok) {
        throw new Error(payload && !payload.success ? payload.error : responseText || "Failed to load dashboard")
      }

      if (!payload || !payload.success) {
        throw new Error(payload ? payload.error : "Dashboard API returned a non-JSON response")
      }

      setStats(payload.data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const statItems = [
    {
      label: "Registered Users",
      value: stats?.registeredUsers ?? 0,
      hint: "Number of registered users",
      icon: Users,
      accent: "from-cyan-400/25 to-cyan-400/5",
    },
    {
      label: "Sessions",
      value: stats?.sessions ?? 0,
      hint: `${stats?.upcomingSessions ?? 0} upcoming`,
      icon: CalendarDays,
      accent: "from-violet-400/25 to-violet-400/5",
    },
    {
      label: "Companies",
      value: stats?.companies ?? 0,
      hint: "Live company records",
      icon: Building2,
      accent: "from-emerald-400/25 to-emerald-400/5",
    },
    {
      label: "Logo Loop",
      value: stats?.logoLoop ?? 0,
      hint: "Partners shown on the homepage",
      icon: Layers3,
      accent: "from-amber-400/25 to-amber-400/5",
    },
    {
      label: "Admins",
      value: stats?.adminUsers ?? 0,
      hint: `${stats?.dataUsers ?? 0} data users`,
      icon: ShieldCheck,
      accent: "from-rose-400/25 to-rose-400/5",
    },
  ]

  return (
    <div className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-foreground/10 bg-linear-to-br from-foreground/10 via-foreground/5 to-transparent p-6 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-foreground/70">
                <Sparkles size={12} /> Live overview
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Admin Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-foreground/70 sm:text-base">
                A single place to track registrations, sessions, companies, and the homepage partner loop.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground/10"
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                Add users <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {statItems.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.label} className={`rounded-2xl border border-foreground/10 bg-linear-to-br ${item.accent} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "--" : item.value}</p>
                    </div>
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/10 p-2 text-foreground/80">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-foreground/65">{item.hint}</p>
                </div>
              )
            })}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/admin/users", title: "Users", desc: "Create accounts, adjust roles, and review registrations.", icon: Users },
            { href: "/admin/sessions", title: "Sessions", desc: "Add talks, dates, links, and company assignments.", icon: CalendarDays },
            { href: "/admin/company", title: "Companies", desc: "Manage partner profiles, social links, and logos.", icon: Building2 },
            { href: "/admin/logo-loop", title: "Logo Loop", desc: "Update the homepage partner carousel quickly.", icon: Layers3 },
          ].map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.href}
                href={action.href}
                className={`${statCardClass} group flex flex-col gap-4 transition hover:border-foreground/20 hover:bg-foreground/10`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Quick add</p>
                    <h2 className="mt-2 text-xl font-semibold">{action.title}</h2>
                  </div>
                  <div className="rounded-2xl border border-foreground/10 bg-foreground/10 p-2 text-foreground/80 transition group-hover:translate-x-0.5">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="text-sm leading-6 text-foreground/70">{action.desc}</p>
                <span className="inline-flex w-fit items-center gap-2 text-sm text-foreground/90">
                  Open <Plus size={14} />
                </span>
              </Link>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className={`${statCardClass} xl:col-span-1`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Recent registrations</p>
                <h2 className="mt-2 text-xl font-semibold">New users</h2>
              </div>
              <Link href="/admin/users" className="text-sm text-foreground/70 transition hover:text-foreground">
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(stats?.recentUsers ?? []).length > 0 ? (
                stats!.recentUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-foreground/60">{user.email}</p>
                      </div>
                      <span className="rounded-full border border-foreground/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground/60">
                        {user.role || "user"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-foreground/50">
                      <Clock3 size={12} /> {formatDateTime(user.createdAt)}
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">Loading users...</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">No user data yet.</div>
              )}
            </div>
          </div>

          <div className={`${statCardClass} xl:col-span-1`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Upcoming sessions</p>
                <h2 className="mt-2 text-xl font-semibold">Scheduled talks</h2>
              </div>
              <Link href="/admin/sessions" className="text-sm text-foreground/70 transition hover:text-foreground">
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(stats?.recentSessions ?? []).length > 0 ? (
                stats!.recentSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                    <p className="font-medium leading-6">{session.title}</p>
                    <p className="mt-2 text-xs text-foreground/60">{session.date || "No date"}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-foreground/50">
                      <span>{session.linkCount} link{session.linkCount === 1 ? "" : "s"}</span>
                      <span>{session.companyId || "No company"}</span>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">Loading sessions...</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">No session data yet.</div>
              )}
            </div>
          </div>

          <div className={`${statCardClass} xl:col-span-1`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Recent companies</p>
                <h2 className="mt-2 text-xl font-semibold">Partners</h2>
              </div>
              <Link href="/admin/company" className="text-sm text-foreground/70 transition hover:text-foreground">
                Manage
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(stats?.recentCompanies ?? []).length > 0 ? (
                stats!.recentCompanies.map((company) => (
                  <div key={company.id} className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
                    <p className="font-medium leading-6">{company.name}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/60">
                      {company.description || "No description provided."}
                    </p>
                  </div>
                ))
              ) : loading ? (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">Loading companies...</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-foreground/10 p-6 text-sm text-foreground/50">No company data yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className={`${statCardClass} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">Last sync</p>
            <h2 className="mt-2 text-xl font-semibold">{stats ? formatDateTime(stats.lastUpdated) : loading ? "Loading..." : "No data"}</h2>
            <p className="mt-1 text-sm text-foreground/60">Refresh this dashboard whenever you add or update records.</p>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-foreground/20"
          >
            Add a new record <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  )
}