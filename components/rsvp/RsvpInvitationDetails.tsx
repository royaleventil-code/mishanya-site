import { CalendarDays, Clock3, MapPin, PartyPopper } from "lucide-react";
import type { PublicRsvpEvent } from "@/lib/rsvp";
import {
  formatRsvpEventDate,
  formatRsvpInvitationHeadline,
} from "@/shared/rsvp-invitation.js";

const COPY = {
  ru: {
    invitation: "Приглашение на праздник",
  },
  he: {
    invitation: "הזמנה לחגיגה",
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
      <header className="rsvp-invitation-hero relative overflow-hidden px-5 py-9 text-center sm:px-10 sm:py-12">
        <div aria-hidden className="absolute -start-14 -top-16 h-44 w-44 rounded-full bg-[#ff375f]/10 blur-3xl" />
        <div aria-hidden className="absolute -end-12 top-8 h-48 w-48 rounded-full bg-[#007aff]/10 blur-3xl" />
        <div className="relative">
          <div className="rsvp-material-strong mx-auto flex h-14 w-14 items-center justify-center rounded-[1.15rem] text-[#ff375f]">
            <PartyPopper className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#c81d4a]">{copy.invitation}</p>
          <Heading className="rsvp-display mt-3 text-[2.65rem] font-extrabold sm:text-[3.35rem]">
            {formatRsvpInvitationHeadline(event)}
          </Heading>
          {event.message ? <p className="rsvp-caption mx-auto mt-4 max-w-lg whitespace-pre-line text-[0.98rem] font-medium leading-7">{event.message}</p> : null}
        </div>
      </header>

      <div className="bg-white/90 px-5 py-3 sm:px-7">
        <div className="flex items-center gap-3 border-b border-black/[0.07] py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#007aff]/10 text-[#007aff]"><CalendarDays className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold capitalize leading-5">{eventDate}</p>
          </div>
          <Clock3 aria-hidden className="h-4 w-4 shrink-0 text-zinc-400" />
        </div>
        <div className="flex items-start gap-3 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#ff375f]/10 text-[#ff375f]"><MapPin className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1 self-center">
            <p className="text-sm font-semibold leading-5">{sameLocation ? event.address : event.city}</p>
            {!sameLocation ? <p className="rsvp-caption mt-0.5 text-xs font-medium leading-5">{event.address}</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
