"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { initiateConnection } from "../actions"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function Connect() {
  const router = useRouter()
  const {user} = useUser()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectData, setConnectData] = useState<any | null>(null)
  const searchParams = useSearchParams()
  var id = searchParams.get("id")
  var type = searchParams.get("type")

  useEffect(() => {
    
  }, [id, type, router])

  const onConnect = () => {
    setIsConnecting(true)
    initiateConnection({
      user_id: user?.id,
      user_connect: id,
      type: type,
    })
      .then((response) => {
        console.log("Connection initiated successfully:", response)
        router.push("/connect")
      })
      .catch((error) => {
        console.error("Error initiating connection:", error)
      })
      .finally(() => {
        setIsConnecting(false)
      })
  }

  return (
    <div className="flex items-center justify-center">
      {id && type && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-primary p-8 shadow-lg">
          <h1 className="text-2xl font-bold">Connect to {type}</h1>
          <p className="text-primary-foreground">ID: {id}</p>
          <button
            className="rounded-full bg-primary-foreground px-4 py-2 text-sm font-medium text-primary hover:bg-primary-foreground/80"
            onClick={onConnect}
            disabled={isConnecting}
          >
            Connect
          </button>
        </div>
      )}
    </div>
  )
}
