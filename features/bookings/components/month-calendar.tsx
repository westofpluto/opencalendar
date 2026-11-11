"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, type LocalDate, wallToUtc, weekdayOf } from "@/lib/availability/tz";
import { cn } from "@/lib/cn";
import { type FormatPrefs, formatDateLong } from "@/lib/format";
import { type Month, monthDays, type Slot } from "./booker-view";
import { revealBehavior, shouldReveal } from "./reveal";
import { SlotButton } from "./slot-button";

type Props = {
  month: Month;
  today: LocalDate;
  /** Week start for the grid, 0 = Sunday. */
  weekStart: number;
  prefs: FormatPrefs;
  byDate: Map<string, Slot[]>;
  selectedDate: string | null;
  busy: boolean;
  loading: boolean;
  loadError: string | null;
  empty: boolean;
  seated: boolean;
  /** Column layout: times below the calendar at every width. */
  stacked: boolean;
  nowMs: number;
  preferences: ReactNode;
  onChangeMonth: (delta: number) => void;
  onSelectDate: (key: string) => void;
  onChooseSlot: (slot: Slot) => void;
  onBackToDates?: () => void;
};

/**
 * Month grid plus the chosen day's times (BKG-002). E2E tests rely on this DOM: the "Choose a
 * date" section with aria-busy, the "Days" group, day buttons with aria-pressed and "no times
 * available", "Next month", and slot buttons named by their time.
 */
export function MonthCalendar(props: Props) {
  const { month, prefs, byDate, selectedDate, today } = props;
  const locale = prefs.locale;
  const days = monthDays(month);
  const leading = (weekdayOf(days[0]) - props.weekStart + 7) % 7;
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(Date.UTC(2026, 0, 4 + ((props.weekStart + i) % 7))),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(month.year, month.month - 1, 1));
  const canGoBack = month.year > today.year || (month.year === today.year && month.month > today.month);

  // When the times sit below the calendar (phones, narrow embeds, column layout), picking a day
  // brings them into view; otherwise they would appear off screen with nothing visibly changing.
  const timesRef = useRef<HTMLElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const chosenDay = useRef<HTMLButtonElement>(null);
  const restoreDateFocus = useRef(false);
  const dateSteps = Boolean(props.onBackToDates);
  const showTimesStep = dateSteps && selectedDate !== null;
  const selectedSlots = selectedDate ? byDate.get(selectedDate) ?? [] : [];
  const revealPending = useRef(false);
  useEffect(() => {
    if (!selectedDate && restoreDateFocus.current) {
      restoreDateFocus.current = false;
      chosenDay.current?.focus({ preventScroll: true });
    }
    const el = timesRef.current;
    if (!revealPending.current || !el || !selectedDate) return;
    revealPending.current = false;
    if (dateSteps) {
      backButton.current?.focus({ preventScroll: true });
    } else if (shouldReveal(el.getBoundingClientRect(), window.innerHeight)) {
      el.scrollIntoView({ block: "start", behavior: revealBehavior() });
    }
  }, [dateSteps, selectedDate]);

  return (
    // Side by side once the panel (not the window) is wide enough; see BookingWidget.
    <div className={cn("grid gap-4 @xl/panel:gap-6", !dateSteps && !props.stacked && "@xl/panel:grid-cols-[1fr_220px]")}>
      <section hidden={showTimesStep} aria-label="Choose a date" aria-busy={props.busy}>
        <div className="mb-2 flex items-center justify-between @xl/panel:mb-4">
          <h2 className="font-medium" aria-live="polite">
            {monthLabel}
          </h2>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={!canGoBack} onClick={() => props.onChangeMonth(-1)}>
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => props.onChangeMonth(1)}>
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden>
          {weekdayNames.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1" role="group" aria-label="Days">
          {Array.from({ length: leading }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const key = formatDate(d);
            const available = (byDate.get(key)?.length ?? 0) > 0;
            const selected = key === selectedDate;
            const label = formatDateLong(wallToUtc(d, 12 * 60, "UTC"), { ...prefs, timeZone: "UTC" });
            return (
              <Button
                key={key}
                type="button"
                variant={selected ? "default" : available ? "secondary" : "ghost"}
                disabled={!available}
                aria-pressed={selected}
                aria-label={`${label}${available ? "" : ", no times available"}`}
                onClick={(event) => {
                  if (dateSteps) chosenDay.current = event.currentTarget;
                  revealPending.current = true;
                  props.onSelectDate(key);
                }}
                // No transition: axe must never sample a day mid-fade from the dimmed loading state.
                className={cn(
                  // Square, but capped: in a wide panel the cells would otherwise grow huge.
                  "aspect-square h-auto max-h-14 w-full rounded-md text-sm transition-none",
                  available && "font-medium hover:bg-primary hover:text-primary-foreground",
                  !available && "text-muted-foreground",
                )}
              >
                {d.day}
              </Button>
            );
          })}
        </div>
        {props.loading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Spinner /> Loading…
          </p>
        )}
        {props.loadError && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{props.loadError}</AlertDescription>
          </Alert>
        )}
        {!props.loading && !props.loadError && props.empty && (
          <p className="mt-3 text-sm text-muted-foreground">No times available this month. Try the next month.</p>
        )}
        {props.preferences}
      </section>
      <section ref={timesRef} hidden={dateSteps && !showTimesStep} aria-label="Choose a time" className="scroll-mt-4">
        {selectedDate ? (
          <>
            {props.onBackToDates && (
              <Button ref={backButton} type="button" variant="ghost" className="mb-2" onClick={() => {
                restoreDateFocus.current = true;
                props.onBackToDates?.();
              }}>
                <ChevronLeft className="size-4" aria-hidden /> Back to calendar
              </Button>
            )}
            <h2 className="mb-3 text-sm font-medium">
              {dateSteps
                ? formatDateLong(Date.parse(`${selectedDate}T12:00:00Z`), { ...prefs, timeZone: "UTC" })
                : formatDateLong(selectedSlots[0]?.start ?? props.nowMs, prefs)}
            </h2>
            {showTimesStep && selectedSlots.length === 0 && (
              <p className="text-sm text-muted-foreground" role="status">
                {props.loading ? "Loading…" : props.loadError ?? "No times available for this date."}
              </p>
            )}
            {/* Below the calendar: a compact grid, no scroll box inside the scrolling page.
                Beside it: a column that scrolls within the calendar's height. */}
            <ul
              className={cn(
                "grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2",
                !dateSteps && !props.stacked && "@xl/panel:flex @xl/panel:max-h-96 @xl/panel:flex-col @xl/panel:overflow-y-auto",
              )}
            >
              {selectedSlots.map((s) => (
                <li key={s.start}>
                  <SlotButton slot={s} prefs={prefs} seated={props.seated} className="w-full" onChoose={props.onChooseSlot} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a date to see available times.</p>
        )}
      </section>
    </div>
  );
}
