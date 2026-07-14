import { Clock3, MapPin, PartyPopper } from "lucide-react";
import type { PublicRsvpEvent } from "@/lib/rsvp";
import { formatRsvpEventDate } from "@/shared/rsvp-invitation.js";

const COPY = {
  ru: {
    invitation: "Приглашение на праздник",
    turns: (age: number) => `исполняется ${age}!`,
  },
  he: {
    invitation: "הזמנה לחגיגה",
    turns: (age: number) => `חוגג/ת ${age}!`,
  },
} as const;

export function RsvpInvitationDetails({
  event,
  headingLevel = "h1",
}: {
  event: PublicRsvpEvent;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  const copy = COPY[event.locale];
  const Heading = headingLevel;
  const eventDate = formatRsvpEventDate(event);
  const sameLocation = event.city.trim().toLocaleLowerCase() === event.address.trim().toLocaleLowerCase();

  return (
    <>
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#fff0f4_0%,#f2efff_58%,#edf7ff_100%)] px-5 py-9 text-center sm:px-9 sm:py-12">
        <div aria-hidden className="absolute -start-10 -top-12 h-36 w-36 rounded-full bg-[#ff375f]/15 blur-2xl" />
        <div aria-hidden className="absolute -end-8 top-12 h-40 w-40 rounded-full bg-[#5e5ce6]/15 blur-2xl" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-[#ff375f] shadow-sm">
            <PartyPopper className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#d91f4d]">{copy.invitation}</p>
          <Heading className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            {event.childName} {copy.turns(event.childAge)}
          </Heading>
          {event.message ? <p className="mx-auto mt-4 max-w-lg whitespace-pre-line text-base leading-7 text-zinc-650">{event.message}</p> : null}
        </div>
      </header>

      <div className="grid gap-3 border-y border-black/[0.05] bg-white p-5 sm:grid-cols-2 sm:p-7">
        <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-[#5e5ce6]"><Clock3 className="h-5 w-5" /></span>
          <p className="self-center text-sm font-black capitalize">{eventDate}</p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><MapPin className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-black">{sameLocation ? event.address : event.city}</p>
            {!sameLocation ? <p className="mt-1 text-xs leading-5 text-zinc-500">{event.address}</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
