// Adapted from Rare UI: https://www.rareui.com/components/githubactivity
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type Contribution = {
  date: string;
  count: number;
  level: ContributionLevel;
};

export type RepoContribution = {
  name: string;
  count: number;
  description?: string;
  logo?: React.ReactNode;
  href?: string;
};

const DEFAULT_ACCENT = "#39d353";
const DEFAULT_CELL_SIZE = 11;
const DEFAULT_LABEL = "Pull requests in:";
const DEFAULT_MONTHS = 12;
const WEEKS_PER_MONTH = 365.25 / 12 / 7;
const STACK_LIMIT = 3;
const MIN_CARD_WIDTH = 320;
const MIN_LABEL_WEEKS = 3;
// the p-4 on the card, both sides; the width math below has to add it back
const CARD_PADDING = 32;

const gapFor = (cellSize: number) => Math.max(2, Math.round(cellSize / 4));
// never zero: weeks.slice(-0) would hand back the whole history instead of nothing
const weeksFor = (months: number) =>
  Math.max(1, Math.ceil(months * WEEKS_PER_MONTH));

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", bounce: 0.2, duration: 0.62 } as const;
const HEADER_SPRING = { ...SPRING, bounce: 0.45 } as const;
const ROW_SPRING = { ...SPRING, bounce: 0.26, delay: 0.08 } as const;
const TOOLTIP_FADE = { duration: 0.14, ease: EASE_OUT } as const;
const TOOLTIP_EDGE = 8;

const LEVELS = [0, 1, 2, 3, 4] as const;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toMonthLabels(weeks: Contribution[][]) {
  const labels: (string | null)[] = weeks.map(() => null);
  const monthAt = (index: number) => weeks[index]?.[0]?.date.slice(5, 7);

  let start = 0;
  for (let i = 1; i <= weeks.length; i++) {
    if (i < weeks.length && monthAt(i) === monthAt(start)) continue;
    // a shorter run is narrower than the label itself, so it would sit under the next month
    if (i - start >= MIN_LABEL_WEEKS) {
      labels[start] = MONTH_NAMES[Number(monthAt(start)) - 1] ?? null;
    }
    start = i;
  }

  return labels;
}

const LEVEL_OPACITY: Record<ContributionLevel, number> = {
  0: 0,
  1: 0.3,
  2: 0.52,
  3: 0.76,
  4: 1,
};

type LevelStyle = { backgroundColor: string; opacity: number };

type HoveredDay = { day: Contribution; x: number; y: number };

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function describeDay({ count, date }: Contribution) {
  const noun = count === 1 ? "contribution" : "contributions";
  return `${count} ${noun} on ${DATE_FORMAT.format(new Date(`${date}T00:00:00`))}`;
}

const CALENDAR_API = "https://github-contributions-api.jogruber.de/v4";

type ApiDay = { date: string; count: number; level: number };

async function fetchCalendar(login: string, signal: AbortSignal) {
  const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(login)}?y=last`, { signal });
  if (!res.ok) throw new Error("Calendar unavailable");

  const days: ApiDay[] = (await res.json())?.contributions ?? [];
  if (!days.length) throw new Error("Calendar unavailable");

  // Keep every contribution, and pad the first column back to Sunday.
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const padding = Array.from({ length: first.getUTCDay() }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() - first.getUTCDay() + index);
    return { date: date.toISOString().slice(0, 10), count: 0, level: 0 as const };
  });
  return [...padding, ...days.map<Contribution>((day) => ({
    date: day.date,
    count: day.count,
    level: Math.min(4, Math.max(0, day.level)) as ContributionLevel,
  }))];
}

function useGitHubUser(login: string | undefined) {
  const [attempt, retry] = React.useReducer((value: number) => value + 1, 0);
  const [result, setResult] = React.useState<{
    key: string;
    contributions?: Contribution[];
    error: boolean;
  }>();
  const key = `${login}:${attempt}`;

  React.useEffect(() => {
    if (!login) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;

    fetchCalendar(login, controller.signal).then(
      contributions => {
        if (active) setResult({ key, contributions, error: false });
      },
      () => {
        if (active) setResult({ key, error: true });
      },
    ).finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [login, key]);

  return { data: result?.key === key ? result : undefined, retry };
}

function toScale(accent: string | string[]): LevelStyle[] {
  if (typeof accent === "string") {
    return LEVELS.map((level) => ({
      backgroundColor: accent,
      opacity: LEVEL_OPACITY[level],
    }));
  }

  const colors = accent.length > 4 ? accent : ["transparent", ...accent];
  return LEVELS.map((level) => {
    const color = colors[level] ?? colors.at(-1) ?? "transparent";
    return { backgroundColor: color, opacity: color === "transparent" ? 0 : 1 };
  });
}

function toWeeks(contributions: Contribution[]) {
  const weeks: Contribution[][] = [];
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push(contributions.slice(i, i + 7));
  }
  return weeks;
}

function useFittedColumns(cellSize: number, gap: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState<number>();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () =>
      setColumns(
        Math.max(1, Math.floor((el.clientWidth + gap) / (cellSize + gap))),
      );

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cellSize, gap]);

  return [ref, columns] as const;
}

const Tooltip = ({
  hovered,
  reduceMotion,
}: {
  hovered: HoveredDay;
  reduceMotion: boolean | null;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [left, setLeft] = React.useState(hovered.x);

  useIsoLayoutEffect(() => {
    const half = (ref.current?.offsetWidth ?? 0) / 2;
    const edge = TOOLTIP_EDGE + half;
    setLeft(Math.min(Math.max(hovered.x, edge), window.innerWidth - edge));
  }, [hovered]);

  return createPortal(
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left,
        top: hovered.y,
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
    >
      <motion.div
        ref={ref}
        className="whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background"
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        transition={reduceMotion ? { duration: 0 } : TOOLTIP_FADE}
      >
        {describeDay(hovered.day)}
      </motion.div>
    </div>,
    document.body,
  );
};

const ContributionGrid = ({
  contributions,
  scale,
  cellSize,
  months,
  showMonths,
  label,
  reduceMotion,
}: {
  contributions: Contribution[];
  scale: LevelStyle[];
  cellSize: number;
  months: number;
  showMonths: boolean;
  label: string;
  reduceMotion: boolean | null;
}) => {
  const weeks = React.useMemo(() => toWeeks(contributions), [contributions]);
  const gap = gapFor(cellSize);
  const [ref, columns] = useFittedColumns(cellSize, gap);
  const [hovered, setHovered] = React.useState<HoveredDay>();

  const cap = Math.min(weeks.length, weeksFor(months));
  const visible = weeks.slice(-Math.min(cap, columns ?? cap));

  const hover = (day: Contribution) => (event: React.PointerEvent) => {
    const cell = event.currentTarget.getBoundingClientRect();
    setHovered({ day, x: cell.left + cell.width / 2, y: cell.top });
  };

  return (
    <div
      ref={ref}
      data-slot="github-activity-grid"
      role="img"
      aria-label={label}
      className="relative"
    >
      {showMonths && (
        <motion.div
          className="flex justify-center"
          style={{ gap, marginBottom: gap }}
          initial={false}
        >
          {toMonthLabels(visible).map((month, index) => (
            <div
              key={index}
              className="relative h-4 shrink-0"
              style={{ width: cellSize }}
            >
              {month && (
                <span className="absolute left-0 top-0 text-[11px] leading-none text-muted">
                  {month}
                </span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      <div
        className="flex justify-center"
        style={{ gap }}
        onPointerLeave={() => setHovered(undefined)}
      >
        {visible.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col" style={{ gap }}>
            {week.map((day) => (
              <motion.div
                key={day.date}
                onPointerEnter={hover(day)}
                className="shrink-0 rounded-[3px] bg-foreground/[0.08]"
                style={{ width: cellSize, height: cellSize }}
                initial={false}
                title={describeDay(day)}
              >
                <div
                  className="h-full w-full rounded-[3px]"
                  style={scale[day.level] ?? scale[0]}
                />
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hovered && (
          <Tooltip
            key="tooltip"
            hovered={hovered}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Avatar = ({
  repo,
  layoutId,
  transition,
  className,
}: {
  repo: RepoContribution;
  layoutId: string;
  transition: Transition;
  className?: string;
}) => (
  <motion.span
    layoutId={layoutId}
    transition={transition}
    className={cn(
      "grid size-7 shrink-0 place-items-center overflow-hidden text-[11px] font-medium text-muted",
      "[&_img]:size-full [&_img]:object-cover [&_svg]:size-full",
      className,
    )}
  >
    {repo.logo ?? <span aria-hidden="true">{repo.name.charAt(0)}</span>}
  </motion.span>
);

const RepoRow = ({
  repo,
  layoutId,
  transition,
}: {
  repo: RepoContribution;
  layoutId: string;
  transition: Transition;
}) => {
  const className =
    "flex items-center gap-3 rounded-lg mx-2 px-2 py-2 transition-colors hover:bg-foreground/5";

  const content = (
    <>
      <Avatar repo={repo} layoutId={layoutId} transition={transition} />
      <span className="min-w-0 flex-1 text-sm leading-snug text-foreground [overflow-wrap:anywhere]">
        {repo.name}
        {repo.description && <span className="mt-1 block text-xs leading-relaxed text-muted">{repo.description}</span>}
      </span>
      <span className="text-sm tabular-nums text-foreground/70">
        {repo.count}
      </span>
    </>
  );

  return repo.href ? (
    <a href={repo.href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
};

const Chevron = ({
  open,
  transition,
}: {
  open: boolean;
  transition: Transition;
}) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="size-7 text-muted"
    initial={false}
    animate={{ rotate: open ? 180 : 0 }}
    transition={transition}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16 10-4 4-4-4" />
  </motion.svg>
);

export type GitHubActivityProps = React.ComponentProps<"div"> & {
  username?: string;
  contributions?: Contribution[];
  repos?: RepoContribution[];
  year?: number;
  accent?: string | string[];
  cellSize?: number;
  months?: number;
  showMonths?: boolean;
  label?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const GitHubActivity = ({
  className,
  username,
  contributions: contributionsProp = [],
  repos: reposProp = [],
  year,
  accent = DEFAULT_ACCENT,
  cellSize = DEFAULT_CELL_SIZE,
  months = DEFAULT_MONTHS,
  showMonths = false,
  label = DEFAULT_LABEL,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  style,
  ...props
}: GitHubActivityProps) => {
  const reduceMotion = useReducedMotion();
  const uid = React.useId();
  const [openState, setOpenState] = React.useState(defaultOpen);

  const open = openProp ?? openState;
  const toggle = () => {
    if (openProp === undefined) setOpenState(!open);
    onOpenChange?.(!open);
  };

  const needsCalendar = !contributionsProp.length;
  const { data: fetched, retry } = useGitHubUser(
    needsCalendar ? username : undefined,
  );
  const loading = Boolean(username && needsCalendar && !fetched);
  const failed = Boolean(username && needsCalendar && fetched?.error);

  const contributions = contributionsProp.length
    ? contributionsProp
    : (fetched?.contributions ?? []);
  const repos = reposProp;

  const scale = React.useMemo(() => toScale(accent), [accent]);
  const transition = reduceMotion ? { duration: 0 } : SPRING;
  const headerTransition = reduceMotion ? { duration: 0 } : HEADER_SPRING;
  const rowTransition = reduceMotion ? { duration: 0 } : ROW_SPRING;

  const listMotion = {
    initial: false as const,
    animate: { x: 0 },
    exit: { opacity: 0 },
  };

  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  const heading = loading
    ? "Loading GitHub activity…"
    : failed
      ? "GitHub activity is unavailable"
      : `${total.toLocaleString("en-US")} contributions${year ? ` in ${year}` : username ? " in the past year" : ""}`;

  const gap = gapFor(cellSize);
  const columns = Math.min(
    Math.ceil(contributions.length / 7),
    weeksFor(months),
  );
  const width = Math.max(
    MIN_CARD_WIDTH,
    columns * (cellSize + gap) - gap + CARD_PADDING,
  );

  return (
    <div
      data-slot="github-activity"
      className={cn(
        "relative w-full max-w-full rounded-[24px] bg-code p-4",
        className,
      )}
      style={{ width, ...style }}
      {...props}
    >
      <p aria-live="polite" className="mb-4 text-base font-medium text-foreground px-1.5">
        {heading}
      </p>

      {loading || failed ? (
        <div className="flex min-h-[114px] items-center px-1.5 text-sm text-muted">
          {failed ? (
            <p>
              The contribution calendar could not be loaded.{' '}
              <button type="button" onClick={retry} className="font-medium text-foreground underline underline-offset-4">Try again</button>
              {username && <> or <a href={`https://github.com/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">view GitHub</a>.</>}
            </p>
          ) : "Fetching the latest contribution calendar."}
        </div>
      ) : (
        <ContributionGrid
          contributions={contributions}
          scale={scale}
          cellSize={cellSize}
          months={months}
          showMonths={showMonths}
          label={heading}
          reduceMotion={reduceMotion}
        />
      )}

      {repos.length > 0 && (
        <motion.div
          layout
          id={`${uid}-panel`}
          data-slot="github-activity-panel"
          data-state={open ? "open" : "closed"}
          className={cn(
            "mt-3 bg-background",
          )}
          style={{ borderRadius: 18 }}
          transition={transition}
        >
          <motion.div
            layout="position"
            transition={headerTransition}
            className="flex items-center justify-between gap-3 py-3 px-4"
          >
            <span className="text-sm text-foreground">{label}</span>

            <div className="flex items-center gap-3">
              {!open && (
                <div className="flex items-center">
                  {repos.slice(0, STACK_LIMIT).map((repo, index) => (
                    <Avatar
                      key={index}
                      repo={repo}
                      layoutId={`${uid}-${index}`}
                      transition={transition}
                      className="-ml-2 first:ml-0"
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={`${uid}-panel`}
                aria-label={
                  open ? "Hide contributed repositories" : "Show all contributed repositories"
                }
                className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-code transition-colors"
              >
                <Chevron open={open} transition={transition} />
              </button>
            </div>
          </motion.div>

          <AnimatePresence initial={false} mode="popLayout">
            {open && (
              <motion.ul
                key="list"
                layout="position"
                {...listMotion}
                transition={rowTransition}
                className="max-h-80 overflow-y-auto px-0.5 pb-1"
              >
                {repos.map((repo, index) => (
                  <li key={index}>
                    <RepoRow
                      repo={repo}
                      layoutId={`${uid}-${index}`}
                      transition={transition}
                    />
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export { GitHubActivity };
export default GitHubActivity;
