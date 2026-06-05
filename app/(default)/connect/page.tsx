"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Building2, Users2 } from "lucide-react"
import { toast } from "sonner"

import { getConnections, initiateConnection } from "../../actions"
import ConnectCompanyCard from "@/components/connect-company-card"
import ConnectCompanyOverlay from "@/components/connect-company-overlay"
import ConnectUserCard from "@/components/connect-user-card"
import ConnectUserOverlay from "@/components/connect-user-overlay"
import DividerComponent from "@/components/divider"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type TabValue = "user" | "company"

type ConnectRecord = {
  _id?: string
  id?: string
  type?: TabValue
  name?: string
  fullName?: string
  firstName?: string
  lastName?: string
  companyId?: string | number
  companyEmail?: string
  course?: string
  imageUrl?: string
  logoUrl?: string
} & Record<string, unknown>

function getConnectionName(connection: ConnectRecord) {
  if (connection?.name) return connection.name
  if (connection?.fullName) return connection.fullName
  return `${connection?.firstName || ""} ${connection?.lastName || ""}`.trim()
}

export default function Connect() {
  const router = useRouter()
  const { user } = useUser()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabValue>("user")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connections, setConnections] = useState<ConnectRecord[] | null>(null)
  const [selectedUser, setSelectedUser] = useState<ConnectRecord | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<ConnectRecord | null>(null)
  const [connectData, setConnectData] = useState<ConnectRecord | null>(null)

  const id = searchParams.get("id")
  const type = searchParams.get("type")
  const connectionRequestKey = id && type ? `${type}:${id}` : null
  const [dismissedConnectionRequestKey, setDismissedConnectionRequestKey] = useState<string | null>(null)
  const isOpen = Boolean(connectionRequestKey) && dismissedConnectionRequestKey !== connectionRequestKey

  useEffect(() => {
    if (!id || !type) return

    if (type === "user") {
      fetch(`/api/getUserByUserId?user_id=${id}`)
        .then((res) => res.json())
        .then((response) => {
          setConnectData(response.success ? response.data : null)
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
          setConnectData(null)
        })
        .finally(() => setIsLoading(false))
    } else if (type === "company") {
      fetch(`/api/getCollectionData?collection=companies`)
        .then((res) => res.json())
        .then((response) => {
          if (response.success && Array.isArray(response.data)) {
            const found = response.data.find((company: ConnectRecord) => String(company.companyId) === String(id) || String(company._id) === String(id))
            setConnectData(found || null)
          } else {
            setConnectData(null)
          }
        })
        .catch((error) => {
          console.error("Error fetching company data:", error)
          setConnectData(null)
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, type])

  useEffect(() => {
    getConnections(user?.id || "")
      .then((response) => {
        if (response.success) {
          setConnections([...(response.data || [])])
        }
      })
      .catch((error) => {
        console.error("Error fetching connections:", error)
      })
  }, [user?.id])

  const filteredConnections = useMemo(() => {
    if (!connections) return [] as ConnectRecord[]

    return connections
      .filter((connection) => connection.type === activeTab)
      .sort((a, b) => getConnectionName(a).localeCompare(getConnectionName(b), undefined, { sensitivity: "base" }))
  }, [activeTab, connections])

  const groupedConnections = useMemo(() => {
    if (!filteredConnections.length) return [] as Array<{ letter: string; items: ConnectRecord[] }>

    const groups = filteredConnections.reduce((acc: Record<string, ConnectRecord[]>, connection: ConnectRecord) => {
      const firstChar = getConnectionName(connection).trim().charAt(0).toUpperCase()
      const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#"
      acc[letter] ||= []
      acc[letter].push(connection)
      return acc
    }, {})

    return Object.keys(groups)
      .sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
      .map((letter) => ({ letter, items: groups[letter] }))
  }, [filteredConnections])

  const closeConnectionDialog = () => {
    if (connectionRequestKey) {
      setDismissedConnectionRequestKey(connectionRequestKey)
    }
    router.replace("/connect")
  }

  const onConnect = async () => {
    setIsConnecting(true)
    const payload =
      type === "company"
        ? { user_id: user?.id, user_connect: connectData?._id || id, type }
        : { user_id: user?.id, user_connect_short: id, type }

    const response = await initiateConnection(payload)

    if (!response.success) {
      toast.error(response.error || "Failed to initiate connection")
      setIsConnecting(false)
      return
    }

    router.push("/connect")
    toast.success("Connection initiated successfully!")
    setIsConnecting(false)
  }

  const isCompanyRequest = type === "company"
  const modalDisplayName = isCompanyRequest
    ? connectData?.name || "Unnamed Company"
    : `${connectData?.firstName || ""} ${connectData?.lastName || ""}`.trim() || "Unknown User"
  const modalImage = connectData?.logoUrl || connectData?.imageUrl || "/images/ProspaceMinimalLogo-2.png"

  const tabButtonClass = (tabValue: TabValue) =>
    `rounded-md border px-6 py-1.5 text-xs uppercase tracking-[0.24em] transition-all duration-300 ${
      activeTab === tabValue
        ? "border-white/10 bg-[#7d53ef] text-white shadow-[0_8px_24px_rgba(125,83,239,0.38)]"
        : "border-white/25 bg-black/10 text-white/80 hover:border-white/45 hover:bg-white/10"
    }`

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090b22] pb-8 pt-24 text-white lg:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(146,116,255,0.28),transparent_23%),radial-gradient(circle_at_50%_100%,rgba(255,168,228,0.36),transparent_22%),linear-gradient(180deg,rgba(7,8,28,0.3),rgba(7,8,28,0.94))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.14),transparent_4%),radial-gradient(circle_at_88%_8%,rgba(255,255,255,0.12),transparent_5%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.45)),linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_35%)]" />

      <ConnectUserOverlay open={activeTab === "user" && !!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} />
      <ConnectCompanyOverlay open={activeTab === "company" && !!selectedCompany} company={selectedCompany} onClose={() => setSelectedCompany(null)} />

      {isOpen && (
        <Dialog
          open={isOpen}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              setDismissedConnectionRequestKey(null)
              return
            }
            closeConnectionDialog()
          }}
        >
          <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-white/20 bg-linear-to-br from-[#1f1330]/95 via-primary/85 to-[#120a14] p-0 shadow-[0_30px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-xl">
            <div className="border-b border-white/10 bg-linear-to-r from-[#FF5FA2]/20 via-white/5 to-transparent px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="uppercase tracking-[0.35em] text-white/60">Connection Request</h2>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/75">
                  {isCompanyRequest ? "Company" : "User"}
                </span>
              </div>
            </div>
            {isLoading ? (
              <div className="px-6 py-6">
                <div className="h-4 w-24 animate-pulse rounded-full bg-white/15" />
                <div className="mt-4 h-16 animate-pulse rounded-2xl bg-white/10" />
              </div>
            ) : connectData ? (
              <>
                <div className="px-6 pt-6 pb-5">
                  <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[#FF5FA2]/25 blur-xl" />
                      <Image src={modalImage} alt={modalDisplayName} width={68} height={68} className="relative h-17 w-17 rounded-full border border-white/25 object-cover shadow-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/55">Review profile</p>
                      <p className="mt-1 truncate text-xl font-semibold leading-tight text-white">{modalDisplayName}</p>
                      <p className="mt-2 text-sm leading-snug text-white/75">
                        {isCompanyRequest ? connectData?.companyEmail || "No company email provided" : connectData?.course || "No course information provided"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/75">This request will add them to your connections list if you continue.</p>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/15 px-6 py-4 sm:flex-row sm:justify-end">
                  <button onClick={closeConnectionDialog} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={onConnect} disabled={isConnecting} className="cursor-pointer rounded-xl bg-linear-to-r from-[#FF5FA2] to-[#FF7C70] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,95,162,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-6 py-6">
                <p className="text-base font-medium text-white">Connection target not found.</p>
                <p className="mt-2 text-sm leading-6 text-white/70">The profile you opened may have been removed or the link is no longer valid.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <header className="flex w-full flex-col items-center gap-4 text-center">
          <h1 className={`${moscaLaroke.className} text-[2.5rem] leading-none sm:text-[3rem] lg:text-[4rem]`}>Connect</h1>
          <p className={`${sora.className} max-w-2xl text-sm font-light tracking-[0.3em] text-white/70 sm:text-base`}>
            Browse through attendees and partner companies. Connect directly to exchange insights and opportunities.
          </p>
          <DividerComponent />
        </header>

        <section className="w-full rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,33,0.72),rgba(83,56,156,0.26))] px-4 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-md lg:px-6 lg:py-6">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex rounded-lg border border-white/20 bg-black/10 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <button className={tabButtonClass("user")} onClick={() => setActiveTab("user")}>
                <Users2 className="mr-2 inline-block size-4" />
                Users
              </button>
              <button className={tabButtonClass("company")} onClick={() => setActiveTab("company")}>
                <Building2 className="mr-2 inline-block size-4" />
                Companies
              </button>
            </div>
          </div>

          {connections ? (
            <div className="relative max-h-[58vh] overflow-y-auto pr-3 lg:pr-4">
              <div className="space-y-5">
                {groupedConnections.length > 0 ? (
                  groupedConnections.map((group) => (
                    <div key={group.letter} className="space-y-3">
                      <div className="inline-flex min-w-[9rem] items-center rounded-sm bg-[linear-gradient(90deg,rgba(183,77,143,0.42),rgba(255,255,255,0.12))] px-6 py-1.5 text-2xl text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <span className={`${moscaLaroke.className} translate-y-[1px]`}>{group.letter}</span>
                      </div>
                      <div className="space-y-3">
                        {group.items.map((connection) =>
                          activeTab === "user" ? (
                            <ConnectUserCard key={connection.id || connection._id} user={connection} onClick={() => setSelectedUser(connection)} />
                          ) : (
                            <ConnectCompanyCard key={connection.id || connection._id} company={connection} onClick={() => setSelectedCompany(connection)} />
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-sm text-white/75">No connections found.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="px-2 py-10 text-center text-sm tracking-[0.24em] text-white/70">Loading..</p>
          )}
        </section>
      </div>
    </div>
  )
}
