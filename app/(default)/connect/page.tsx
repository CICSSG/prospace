"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { getConnections, getUser, initiateConnection } from "../../actions"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { toast } from "sonner"
import { Building, Users2 } from "lucide-react"

export default function Connect() {
  const router = useRouter()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("user")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectData, setConnectData] = useState<any | null>(null)
  const [connections, setConnections] = useState<any | null>(null)
  const [filteredConnections, setFilteredConnections] = useState<any | null>(null)
  const searchParams = useSearchParams()
  var id = searchParams.get("id")
  var type = searchParams.get("type")

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
        setConnections(response.data)
      })
      .catch((error) => {
        console.error("Error fetching connections:", error)
      })
  }, [id, type, router, user])

  useEffect(() => {
    if (connections) {
      const filtered = connections.filter((connection: any) => connection.type === activeTab)
      setFilteredConnections(filtered)
    }
  }, [activeTab, connections])

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
    <div className="flex h-screen w-full justify-center bg-linear-to-r from-purple-500/15 to-pink-500/15 pt-30 pb-4">
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

      <div className="flex h-fit flex-col items-center gap-4 rounded-lg p-4 shadow-lg w-full mx-2 bg-primary/10">
        {connections ? (
          <>
          <div className="flex justify-around w-full *:flex *:gap-1 *:justify-center *:py-2 *:rounded-lg bg-black/20 rounded-lg overflow-hidden py-1 px-1.5">
            <button 
              className={`w-full ${activeTab === "user" ? "bg-white text-black" : ""}`}
              onClick={() => setActiveTab("user")}
            >
              <Users2 /> Users
            </button>
            <button 
              className={`w-full ${activeTab === "company" ? "bg-white text-black" : ""}`}
              onClick={() => setActiveTab("company")}
            >
              <Building /> Companies
            </button>
          </div>
            <div className="flex flex-col gap-4 w-full">
              {filteredConnections && filteredConnections.length > 0 ? filteredConnections.map((connection: any) => (
                <div
                  key={connection.id}
                  className="flex flex-row items-center gap-4 rounded-lg bg-primary/10 p-4 w-full"
                >
                  <Image
                    src={connection.profileImageUrl}
                    alt="Profile Picture"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <div>
                    <p>{connection.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {connection.email}
                    </p>
                  </div>
                </div>
              )) : (<p className="flex flex-row items-center gap-4 rounded-lg bg-primary/10 p-4 w-full">No connections found.</p>)}
            </div>
          </>
        ) : (
          <p>Loading..</p>
        )}
      </div>
    </div>
  )
}
