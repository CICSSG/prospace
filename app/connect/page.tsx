"use client"
import { useSearchParams } from "next/navigation"

export default function Connect() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const type = searchParams.get("type")

  return (
    <div className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-lg bg-primary p-8 shadow-lg">
          <h1 className="text-2xl font-bold">Connect to {type}</h1>
          <p className="text-primary-foreground">ID: {id}</p>
          <button className="rounded-full bg-primary-foreground px-4 py-2 text-sm font-medium text-primary hover:bg-primary-foreground/80">
            Connect
          </button>
        </div>
      </div>
  )
}
