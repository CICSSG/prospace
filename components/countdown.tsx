import localFont from "next/font/local"
import { use, useEffect, useState } from "react"
import { set } from "zod"

const moscaLaroke = localFont({
  src: "./mosca-laroke.regular.otf",
  display: "swap",
})

const sora = localFont({
  src: "./sora-regular.ttf",
  display: "swap",
})

export default function CountdownTimer() {
  const [days, setDays] = useState(15)
  const [hours, setHours] = useState(10)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    const targetDate = new Date("May 16, 2026 GMT+0800").getTime()
    const now = new Date().getTime()
    const distance = targetDate - now

    if (distance > 0) {
      setDays(Math.floor(distance / (1000 * 60 * 60 * 24)))
      setHours(
        Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      )
      setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
      setSeconds(Math.floor((distance % (1000 * 60)) / 1000))
    } else {
      setDays(0)
      setHours(0)
      setMinutes(0)
      setSeconds(0)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1)
      } else {
        if (minutes > 0) {
          setMinutes(minutes - 1)
          setSeconds(59)
        } else {
          if (hours > 0) {
            setHours(hours - 1)
            setMinutes(59)
            setSeconds(59)
          } else {
            if (days > 0) {
              setDays(days - 1)
              setHours(23)
            } else {
              clearInterval(timer)
            }
          }
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [days, hours, minutes, seconds])

  return (
    <div className={`grid auto-cols-max grid-flow-col gap-3 text-center ${sora.className} text-xs text-white/50 *:pt-4`}>
      <div className="flex flex-col gap-2 rounded-box bg-linear-to-r from-[#FF5FA2]/20 to-[#FF5FA2]/0 border border-white/60 p-2">
        <span className={`text-4xl ${moscaLaroke.className} w-16 text-white/80`}>
          {days.toFixed(0).padStart(2, "0")}
        </span>
        days
      </div>
      <div className="flex flex-col gap-2 rounded-box bg-linear-to-r from-[#FF5FA2]/20 to-[#FF5FA2]/0 border border-white/60 p-2">
        <span className={`text-4xl ${moscaLaroke.className} w-16 text-white/80`}>
          {hours.toFixed(0).padStart(2, "0")}
        </span>
        hours
      </div>
      <div className="flex flex-col gap-2 rounded-box bg-linear-to-r from-[#FF5FA2]/20 to-[#FF5FA2]/0 border border-white/60 p-2">
        <span className={`text-4xl  ${moscaLaroke.className} w-16 text-white/80`}>
          {minutes.toFixed(0).padStart(2, "0")}
        </span>
        minutes
      </div>
      <div className="flex flex-col gap-2 rounded-box bg-linear-to-r from-[#FF5FA2]/20 to-[#FF5FA2]/0 border border-white/60 p-2">
        <span className={`text-4xl ${moscaLaroke.className} w-16 text-white/80`}>
          {seconds.toFixed(0).padStart(2, "0")}
        </span>
        seconds
      </div>
    </div>
  )
}
