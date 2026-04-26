import { use, useEffect, useState } from "react"
import { set } from "zod"

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
    <div className="grid auto-cols-max grid-flow-col gap-5 text-center">
      <div className="flex flex-col rounded-box bg-primary p-2 text-neutral-content">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": days, "--digits": 2 } as React.CSSProperties}
            aria-live="polite"
            // aria-label={counter}
          >
            {days}
          </span>
        </span>
        days
      </div>
      <div className="flex flex-col rounded-box bg-primary p-2 text-neutral-content">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": hours, "--digits": 2 } as React.CSSProperties}
            aria-live="polite"
            // aria-label={counter}
          >
            {hours}
          </span>
        </span>
        hours
      </div>
      <div className="flex flex-col rounded-box bg-primary p-2 text-neutral-content">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": minutes, "--digits": 2 } as React.CSSProperties}
            aria-live="polite"
            // aria-label={counter}
          >
            {minutes}
          </span>
        </span>
        min
      </div>
      <div className="flex flex-col rounded-box bg-primary p-2 text-neutral-content">
        <span className="countdown font-mono text-5xl">
          <span
            style={{ "--value": seconds, "--digits": 2 } as React.CSSProperties}
            aria-live="polite"
            // aria-label={counter}
          >
            {seconds}
          </span>
        </span>
        sec
      </div>
    </div>
  )
}
