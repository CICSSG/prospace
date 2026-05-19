import DividerComponent from "@/components/divider"
import EventMapComponent from "@/components/prospace/event-map"
import EventScheduleComponent from "@/components/prospace/event-schedule"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import React from "react"

const Objectives = [
  "Provide accessible internship, OJT, and job opportunities through an accredited tech and career fair.",
  "Prepare students with career workshops on portfolio building, job search, and workplace skills.",
  "Help lower classmen explore tech career paths and plan their academic goals early.",
  "Strengthen ties between the college and industry through direct engagement and dialogue.",
  "Build student confidence, technical proficiency, and readiness for the tech landscape.",
]

const SDGLogos = [
  "/images/SDG4.png",
  "/images/SDG8.jpg",
  "/images/SDG9.jpg",
  "/images/SDG10.png",
  "/images/SDG17.png",
]

const AboutPage = () => {
  return (
    <div className={`mx-8 mt-30 mb-10 flex flex-col items-center gap-4`}>
      <div className={`text-4xl ${moscaLaroke.className}`}>about</div>
      <p className="text-center leading-tight font-thin tracking-[0.2rem]">
        Bringing together students, industry professionals, and academic
        stakeholders
      </p>
      <p className="text-justify">
        A tech and career expo that bridges classroom learning with real
        workplace experience through an onsite job fair, online workshops, and
        direct industry engagement. Designed to prepare students at every stage
        of their academic journey.
      </p>

      <div className="mx-8 w-full">
        <DividerComponent />
      </div>

      <EventScheduleComponent />

      <div className="mx-8 w-full">
        <DividerComponent />
      </div>

      <EventMapComponent />

      <div className="mx-8 w-full">
        <DividerComponent />
      </div>
      <h1 className="text-center text-xl font-thin tracking-[0.25rem]">
        OBJECTIVES
      </h1>
      <div className={`flex flex-col items-center gap-4 w-full`}>
        {Objectives.map((objective, index) => (
          <div className={`flex items-start gap-2 w-fit`} key={index}>
            <p className={`${moscaLaroke.className} w-10 text-2xl md:text-lg md:w-5`}>{index + 1}.</p>
            <p key={index} className="text-justify font-thin w-full">
              {objective}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-8 w-full">
        <DividerComponent />
      </div>
      <h1 className="text-center text-xl font-thin tracking-[0.25rem]">
        SDG ALIGNMENT
      </h1>
      <div className="flex flex-wrap justify-center gap-4 w-70 md:w-full">
        {SDGLogos.map((logo, index) => (
        <img
          key={index}
          src={logo}
          alt={`SDG ${index + 1}`}
          className="w-32 h-32 object-contain"
        />
      ))}
      </div>
    </div>
  )
}

export default AboutPage
