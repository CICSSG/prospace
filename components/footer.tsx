import Image from "next/image";

export default function Footer() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-border/60 bg-linear-to-b from-background via-background to-muted/35">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
                <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            ProSpace 2026
                        </div>

                        <div className="space-y-3">
                            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                The DLSU-D Tech and Career Expo
                            </h2>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Explore sessions, connect with partners, and start your professional journey.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <article className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur-sm">
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                            Career Sessions
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">
                                            May 16, 2026
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                        <Image src={"/images/MicrosoftTeams.svg"} width={20} height={20} alt="Microsoft Teams logo" />  
                                    </div>
                                </div>

                                <p className="text-sm leading-6 text-muted-foreground">
                                    Microsoft Teams and Live
                                </p>
                            </article>

                            <article className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur-sm">
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                            Job Fair
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">
                                            May 18-19, 2026
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                                        CICSSG
                                    </div>
                                </div>

                                <p className="text-sm leading-6 text-muted-foreground">
                                    De La Salle University - Dasmariñas
                                </p>
                            </article>
                        </div>
                    </div>

                    {/* <div className="flex h-full flex-col justify-between gap-5 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
                        <div className="space-y-4">
                            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Partners and Hosts
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                    DLSU-D
                                </div>
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted text-center text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                                    CICSSG
                                </div>
                            </div>

                            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                                Join the conversations, meet recruiters, and move from opportunity to action.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Tip:</span> bring your resume, portfolio, and questions for the teams.
                        </div>
                    </div> */}
                </div>

                <div className="flex flex-col gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>&copy; {new Date().getFullYear()} DLSU-D CICSSG. All rights reserved.</p>
                    <p>ProSpace 2026 · The DLSU-D Tech and Career Expo</p>
                </div>
            </div>
        </footer>
    )
}