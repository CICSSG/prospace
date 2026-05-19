import { moscaLaroke, sora } from "@/components/prospace/fonts"

export default function EventScheduleComponent() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className={`tracking-[0.3rem] uppercase ${sora.className}`}>
        Event Schedule
      </h2>

      <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#7B4DFF]/30 to-[#7B4DFF]/10 px-3 py-4">
        {/* Date */}
        <div className="relative">
          <p className={`${moscaLaroke.className} text-6xl`}>06</p>
          <p
            className={`${moscaLaroke.className} absolute top-0 -left-1 text-6xl opacity-35 blur-xs`}
          >
            06
          </p>
        </div>
        <div className="col-span-3 flex w-full flex-row items-center justify-between">
          {/* Details */}
          <div
            className={`flex flex-col gap-0.5 ${sora.className} text-sm text-white/80`}
          >
            <p className="text-[0.6rem]">JUNE • SATURDAY</p>
            <p className="leading-5 font-semibold tracking-widest text-white/95">
              Online Career <br />
              Sessions
            </p>
            <p className="text-[0.6rem]">Microsoft Teams and Live</p>
          </div>
          {/* Tag */}
          <div
            className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#7B4DFF]/50 py-1 text-center text-[0.65rem] ${sora.className}`}
          >
            Open to All
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#5F92ED]/50 to-[#7B4DFF]/10 px-3 py-4">
        {/* Date */}
        <div className="relative">
          <p className={`${moscaLaroke.className} text-6xl`}>09</p>
          <p
            className={`${moscaLaroke.className} absolute top-0 -left-1 text-6xl opacity-35 blur-xs`}
          >
            09
          </p>
        </div>
        <div className="col-span-3 flex w-full flex-row items-center justify-between">
          {/* Details */}
          <div
            className={`flex flex-col ${sora.className} text-sm text-white/80`}
          >
            <p className="text-[0.6rem]">JUNE • WEDNESDAY</p>
            <p className="font-semibold tracking-widest text-white/95">
              Job Fair
            </p>
            <p className="text-[0.6rem]">Salrial Hall • PBH Courtyard</p>
          </div>
          {/* Tag */}
          <div
            className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#5F92ED]/50 py-1 text-center text-[0.65rem] md:w-fit md:px-2 ${sora.className}`}
          >
            Open to All La Salle Schools
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#FF5FA2]/50 to-[#7B4DFF]/10 px-3 py-4">
        {/* Date */}
        <div className="relative">
          <p className={`${moscaLaroke.className} text-7xl`}>10</p>
          <p
            className={`${moscaLaroke.className} absolute top-0 -left-1 text-7xl opacity-35 blur-xs`}
          >
            10
          </p>
        </div>
        <div className="col-span-3 flex w-full flex-row items-center justify-between">
          {/* Details */}
          <div
            className={`flex flex-col ${sora.className} text-sm text-white/80`}
          >
            <p className="text-[0.6rem]">JUNE • THURSDAY</p>
            <p className="font-semibold tracking-widest text-white/95">
              Job Fair
            </p>
            <p className="text-[0.6rem]">Salrial Hall • PBH Courtyard</p>
          </div>
          {/* Tag */}
          <div
            className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#FF5FA2]/50 py-1 text-center text-[0.65rem] md:w-fit md:px-2 ${sora.className}`}
          >
            Open to All La Salle Schools
          </div>
        </div>
      </div>
    </div>
  )
}
