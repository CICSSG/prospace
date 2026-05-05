"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { getConnections, getUser, initiateConnection } from "../../actions"
import { useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { toast } from "sonner"
import { Building, Users2 } from "lucide-react"
import localFont from "next/font/local";
import DividerComponent from "@/components/divider";
import { m } from "framer-motion";
import { b } from "framer-motion/client";
import ConnectUserOverlay from "@/components/connect-user-overlay"
import ConnectCompanyOverlay from "@/components/connect-company-overlay"
import ConnectUserCard from "@/components/connect-user-card"
import ConnectCompanyCard from "@/components/connect-company-card"

const moscaLaroke = localFont({
  src: "../../mosca-laroke.regular.otf",
  display: "swap",
})

const sora = localFont({
  src: "../../sora-regular.ttf",
  display: "swap",
})

const sampleConnections = [
  {
    _id: "69f143b49b1f25238d59823c",
    clerkId: "user_3D0VtQ9AYdEbwcTIlOILM3kAVL1i",
    firstName: "Alice",
    lastName: "Martinez",
    email: "alice.martinez@example.com",
    course: "Bachelor of Science in Computer Science",
    shortBio: "Sali na kau SIKAPTala <3",
    resumeLink: "https://example.com/resume/alice-martinez",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10001,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d59823d",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1j",
    firstName: "Brian",
    lastName: "ONeil",
    email: "brian.oneil@example.com",
    course: "Bachelor of Science in Business Administration",
    shortBio: "",
    resumeLink: "https://example.com/resume/brian-oneil",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10002,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d59823e",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1k",
    firstName: "Jhloe",
    lastName: "Tan",
    email: "jhloe.tan@example.com",
    course: "Bachelor of Science in Psychology",
    shortBio: "",
    resumeLink: "https://example.com/resume/jhloe-tan",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10003,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d59823f",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1l",
    firstName: "Daniel",
    lastName: "Cruz",
    email: "daniel.cruz@example.com",
    course: "Bachelor of Science in Information Technology",
    shortBio: "",
    resumeLink: "https://example.com/resume/daniel-cruz",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10004,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598240",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1m",
    firstName: "Elena",
    lastName: "Rodriguez",
    email: "elena.rodriguez@example.com",
    course: "Bachelor of Science in Accountancy",
    shortBio: "",
    resumeLink: "https://example.com/resume/elena-rodriguez",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10005,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598241",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1n",
    firstName: "Franco",
    lastName: "Villanueva",
    email: "franco.villanueva@example.com",
    course: "Bachelor of Science in Civil Engineering",
    shortBio: "",
    resumeLink: "https://example.com/resume/franco-villanueva",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10006,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598242",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1o",
    firstName: "Grace",
    lastName: "Lim",
    email: "grace.lim@example.com",
    course: "Bachelor of Science in Marketing Management",
    shortBio: "",
    resumeLink: "https://example.com/resume/grace-lim",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10007,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598243",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1p",
    firstName: "Harvey",
    lastName: "Reyes",
    email: "harvey.reyes@example.com",
    course: "Bachelor of Science in Computer Engineering",
    shortBio: "",
    resumeLink: "https://example.com/resume/harvey-reyes",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10008,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598244",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1q",
    firstName: "Isabella",
    lastName: "Dela Rosa",
    email: "isabella.delarosa@example.com",
    course: "Bachelor of Science in Tourism Management",
    shortBio: "",
    resumeLink: "https://example.com/resume/isabella-dela-rosa",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10009,
    type: "user",
  },
  {
    _id: "69f143b49b1f25238d598245",
    clerkId: "user_3D0VtQ9AYdEbwcTIOILM3kAVL1r",
    firstName: "Joshua",
    lastName: "Velasco",
    email: "joshua.velasco@example.com",
    course: "Bachelor of Science in Architecture",
    shortBio: "",
    resumeLink: "https://example.com/resume/joshua-velasco",
    createdAt: "2026-04-28T23:33:08.832Z",
    updatedAt: "2026-04-28T23:33:08.832Z",
    userId: 10010,
    type: "user",
  },
  {
    _id: "69f407189c02fdf3c3d1e1d7",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/cicssg/image",
    name: "CICSSG",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/cicssg/logo",
    socialLinks: [
      {
        platform: "Facebook",
        url: "https://www.facebook.com/dlsud.cicssg",
      },
      {
        platform: "Instagram",
        url: "https://www.instagram.com/dlsud.cicssg",
      },
    ],
    companyEmail: "cicssg.com",
    moderatorEmails: ["jeremiahnueno2019@gmail.com"],
    description: "This is a test entry for companies",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1d8",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/bosstech/image",
    name: "BossTech",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/bosstech/logo",
    socialLinks: [
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/company/bosstech",
      },
      {
        platform: "Website",
        url: "https://bosstech.example.com",
      },
    ],
    companyEmail: "hello@bosstech.example.com",
    moderatorEmails: ["admin@bosstech.example.com"],
    description: "Enterprise software and automation solutions",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1d9",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/evergreen/image",
    name: "Evergreen Labs",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/evergreen/logo",
    socialLinks: [
      {
        platform: "Facebook",
        url: "https://www.facebook.com/evergreenlabs",
      },
      {
        platform: "Instagram",
        url: "https://www.instagram.com/evergreenlabs",
      },
    ],
    companyEmail: "contact@evergreenlabs.example.com",
    moderatorEmails: ["admin@evergreenlabs.example.com"],
    description: "Sustainability-focused research and development",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1da",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/falcon/image",
    name: "Falcon Freight",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/falcon/logo",
    socialLinks: [
      {
        platform: "Website",
        url: "https://falconfreight.example.com",
      },
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/company/falconfreight",
      },
    ],
    companyEmail: "team@falconfreight.example.com",
    moderatorEmails: ["ops@falconfreight.example.com"],
    description: "Logistics and supply chain services",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1db",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/greenbyte/image",
    name: "Greenbyte Systems",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/greenbyte/logo",
    socialLinks: [
      {
        platform: "Website",
        url: "https://greenbyte.example.com",
      },
      {
        platform: "Instagram",
        url: "https://www.instagram.com/greenbytesystems",
      },
    ],
    companyEmail: "info@greenbyte.example.com",
    moderatorEmails: ["hello@greenbyte.example.com"],
    description: "Energy-efficient cloud infrastructure",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1dc",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/helios/image",
    name: "Helios Health",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/helios/logo",
    socialLinks: [
      {
        platform: "Facebook",
        url: "https://www.facebook.com/helioshealth",
      },
      {
        platform: "Website",
        url: "https://helioshealth.example.com",
      },
    ],
    companyEmail: "support@helioshealth.example.com",
    moderatorEmails: ["support@helioshealth.example.com"],
    description: "Digital health and wellness platform",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1dd",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/ionix/image",
    name: "Ionix Motors",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/ionix/logo",
    socialLinks: [
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/company/ionixmotors",
      },
      {
        platform: "Website",
        url: "https://ionixmotors.example.com",
      },
    ],
    companyEmail: "hello@ionixmotors.example.com",
    moderatorEmails: ["team@ionixmotors.example.com"],
    description: "Electric vehicle technology startup",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1de",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/jade/image",
    name: "Jade Commerce",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/jade/logo",
    socialLinks: [
      {
        platform: "Instagram",
        url: "https://www.instagram.com/jadecommerce",
      },
      {
        platform: "Website",
        url: "https://jadecommerce.example.com",
      },
    ],
    companyEmail: "contact@jadecommerce.example.com",
    moderatorEmails: ["admin@jadecommerce.example.com"],
    description: "Retail analytics and e-commerce optimization",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1df",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/keystone/image",
    name: "Keystone AI",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/keystone/logo",
    socialLinks: [
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/company/keystone-ai",
      },
      {
        platform: "Website",
        url: "https://keystoneai.example.com",
      },
    ],
    companyEmail: "partners@keystoneai.example.com",
    moderatorEmails: ["contact@keystoneai.example.com"],
    description: "Applied AI solutions for enterprises",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1e0",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/lumina/image",
    name: "Lumina Design Studio",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/lumina/logo",
    socialLinks: [
      {
        platform: "Instagram",
        url: "https://www.instagram.com/luminadesignstudio",
      },
      {
        platform: "Website",
        url: "https://luminastudio.example.com",
      },
    ],
    companyEmail: "hello@luminastudio.example.com",
    moderatorEmails: ["hello@luminastudio.example.com"],
    description: "Brand, product, and UX design consultancy",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
  {
    _id: "69f407189c02fdf3c3d1e1e1",
    imageUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/northstar/image",
    name: "Northstar Analytics",
    logoUrl: "https://hd4ny9sgmodyi3bw.public.blob.vercel-storage.com/companies/northstar/logo",
    socialLinks: [
      {
        platform: "LinkedIn",
        url: "https://www.linkedin.com/company/northstar-analytics",
      },
      {
        platform: "Website",
        url: "https://northstaranalytics.example.com",
      },
    ],
    companyEmail: "team@northstaranalytics.example.com",
    moderatorEmails: ["team@northstaranalytics.example.com"],
    description: "Business intelligence and data strategy",
    createdAt: "2026-05-01T01:51:20.997Z",
    updatedAt: "2026-05-01T02:27:59.254Z",
    type: "company",
  },
]

export default function Connect() {
  const router = useRouter()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("user")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectData, setConnectData] = useState<any | null>(null)
  const [connections, setConnections] = useState<any | null>(null)
  const [filteredConnections, setFilteredConnections] = useState<any | null>(null)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const searchParams = useSearchParams()
  var id = searchParams.get("id")
  var type = searchParams.get("type")

  const getConnectionName = (connection: any) => {
    if (connection.name) return connection.name
    if (connection.fullName) return connection.fullName
    return `${connection.firstName || ""} ${connection.lastName || ""}`.trim()
  }

  useEffect(() => {
    if (id && type) {
      getUser(id)
        .then((response) => {
          // console.log("User data fetched successfully:", response)
          setConnectData(response.data)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
          setIsLoading(false)
        })
    }

    getConnections(user?.id || "")
      .then((response) => {
        // console.log("Connections fetched successfully:", response.data)
        setConnections([...(response.data || []), ...sampleConnections])
      })
      .catch((error) => {
        console.error("Error fetching connections:", error)
      })
  }, [id, type, router, user])

  useEffect(() => {
    if (connections) {
      const filtered = connections
        .filter((connection: any) => connection.type === activeTab)
        .sort((a: any, b: any) => {
          const aName = getConnectionName(a).toLowerCase()
          const bName = getConnectionName(b).toLowerCase()
          return aName.localeCompare(bName)
        })
      setFilteredConnections(filtered)
    }
  }, [activeTab, connections])

  const groupedConnections = useMemo(() => {
    if (!filteredConnections || filteredConnections.length === 0) {
      return [] as Array<{ letter: string; items: any[] }>
    }

    const groups = filteredConnections.reduce(
      (acc: Record<string, any[]>, connection: any) => {
        const name = getConnectionName(connection).trim()
        const firstChar = name.charAt(0).toUpperCase()
        const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#"

        if (!acc[letter]) {
          acc[letter] = []
        }

        acc[letter].push(connection)
        return acc
      },
      {}
    )

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "#") return 1
        if (b === "#") return -1
        return a.localeCompare(b)
      })
      .map((letter) => ({ letter, items: groups[letter] }))
  }, [filteredConnections])

  const onConnect = () => {
    setIsConnecting(true)
    initiateConnection({
      user_id: user?.id,
      user_connect: id,
      type: type,
    })
      .then((response) => {
        // console.log("Connection initiated successfully:", response)
        router.push("/connect")
        toast.success("Connection initiated successfully!")
      })
      .catch((error) => {
        console.error("Error initiating connection:", error)
        router.push("/connect")
        toast.error(`${error.message}`)
      })
      .finally(() => {
        setIsConnecting(false)
      })
  }

  return (
    <div className="flex min-h-screen w-full justify-center pt-30 pb-4">
      <ConnectUserOverlay
        open={activeTab === "user" && !!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      <ConnectCompanyOverlay
        open={activeTab === "company" && !!selectedCompany}
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />

      {id && type && (
        <Dialog open={true} onOpenChange={() => router.push("/connect")}>
          <DialogContent className="max-w-md rounded-lg bg-primary p-6 shadow-lg">
            <h2 className="text-xl font-bold">Connection Request</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : connectData ? (
              <>
                <div className="flex flex-row items-center gap-4">
                  <Image
                    src={connectData?.imageUrl}
                    alt="Profile Picture"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <p>
                    Do you want to connect with <br />
                    {connectData?.firstName} {connectData?.lastName}?
                  </p>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => router.push("/connect")}
                    className="rounded px-4 py-2 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="cursor-pointer rounded bg-accent px-4 py-2 text-white hover:bg-accent/80 disabled:bg-accent/50"
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </>
            ) : (
              <p>User data not found.</p>
            )}
          </DialogContent>
        </Dialog>
      )}

      <div className="flex h-fit flex-col items-center gap-4 rounded-lg p-4 shadow-lg w-full mx-2">
        <h1 className={moscaLaroke.className + " text-3xl"}>Connect</h1>
        <p className="font-thin text-center max-w-xs tracking-widest leading-tight mb-4">
          Browse through attendees and partner companies. Connect directly to exchange insights and opportunities.
        </p>
        <DividerComponent />
        {connections ? (
          <>
          <div className="flex justify-around w-full *:flex *:gap-1 *:justify-center *:py-2 *:rounded-lg *:border *:border-white/40 *:transition-all *:duration-300 gap-3 rounded-lg overflow-hidden py-1 px-1.5">
            <button 
              className={`w-full ${activeTab === "user" ? "bg-primary text-white border-none" : ""}`}
              onClick={() => setActiveTab("user")}
            >
              Users
            </button>
            <button 
              className={`w-full ${activeTab === "company" ? "bg-primary text-white border-none" : ""}`}
              onClick={() => setActiveTab("company")}
            >
              Companies
            </button>
          </div>
            <div className="flex flex-col gap-4 w-full">
              {groupedConnections.length > 0 ? (
                groupedConnections.map((group) => (
                  <div key={group.letter} className="flex flex-col gap-2">
                    <p className={"px-3 text-xl font-semibold uppercase bg-linear-to-r from-[#FF5FA2]/22 to-black/0 py-2 rounded " + moscaLaroke.className}>
                      {group.letter}
                    </p>
                    {group.items.map((connection: any) =>
                      activeTab === "user" ? (
                        <ConnectUserCard
                          key={connection.id || connection._id}
                          user={connection}
                          onClick={() => setSelectedUser(connection)}
                        />
                      ) : (
                        <ConnectCompanyCard
                          key={connection.id || connection._id}
                          company={connection}
                          onClick={() => setSelectedCompany(connection)}
                        />
                      )
                    )}
                  </div>
                ))
              ) : (
                <p className="flex flex-row items-center gap-4 rounded-lg bg-linear-to-r from-primary/20 border border-white/50 p-4 w-full">No connections found.</p>
              )}
            </div>
          </>
        ) : (
          <p>Loading..</p>
        )}
      </div>
    </div>
  )
}
