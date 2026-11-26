// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import {
  GrowthCharacter,
  GrowthCriterion,
  GrowthDailyTask,
  GrowthMetric,
  GrowthMetrics,
  GrowthMission,
  GrowthPlayer,
  GrowthProgress,
  GrowthSnapshot,
} from "@/types/types";

/**
 * "Admin igra" (Admin game), admins only.
 *
 * One call works today's numbers out again, saves them as today's snapshot,
 * marks newly won missions, and returns the missions plus recent snapshots.
 * The database refuses anyone who isn't an admin (NOT_ADMIN).
 */

export const GROWTH_METRICS: readonly GrowthMetric[] = [
  "active_listings",
  "active_advertisers",
  "municipalities",
  "conversations",
  "buyer_requests",
  "fresh_listings_pct",
];

export const GROWTH_NOTE_MAX = 200;

const CHARACTERS: readonly GrowthCharacter[] = ["bard", "hunter", "host"];

type Row = Record<string, unknown>;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const toText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

const mapCriteria = (value: unknown): GrowthCriterion[] =>
  Array.isArray(value)
    ? value
        .filter(
          (item): item is Row =>
            !!item &&
            typeof item === "object" &&
            GROWTH_METRICS.includes((item as Row).metric as GrowthMetric),
        )
        .map((item) => ({
          metric: item.metric as GrowthMetric,
          target: toNumber(item.target),
        }))
    : [];

const mapMission = (row: Row): GrowthMission => ({
  number: toNumber(row.number),
  stage: toNumber(row.stage),
  nameSr: String(row.name_sr ?? ""),
  nameEn: String(row.name_en ?? ""),
  boss: row.boss === "mini" || row.boss === "final" ? row.boss : null,
  criteria: mapCriteria(row.criteria),
  wonOn: toText(row.won_on),
});

const mapSnapshot = (row: Row): GrowthSnapshot => ({
  day: String(row.day ?? ""),
  metrics: Object.fromEntries(
    GROWTH_METRICS.map((metric) => [metric, toNumber(row[metric])]),
  ) as GrowthMetrics,
  note: toText(row.note),
  noteByName: toText(row.note_by_name),
  computedAt: String(row.computed_at ?? ""),
});

const isCharacter = (value: unknown): value is GrowthCharacter =>
  CHARACTERS.includes(value as GrowthCharacter);

const mapPlayers = (rows: Row[]): GrowthPlayer[] =>
  rows
    .filter((row) => isCharacter(row.character) && typeof row.user_id === "string")
    .map((row) => ({
      character: row.character as GrowthCharacter,
      userId: row.user_id as string,
      name: toText(row.name),
      avatarUrl: toText(row.avatar_url),
    }));

const mapDailyTasks = (rows: Row[]): GrowthDailyTask[] =>
  rows
    .filter((row) => isCharacter(row.character) && typeof row.task_key === "string")
    .map((row) => ({
      key: row.task_key as string,
      character: row.character as GrowthCharacter,
      labelSr: String(row.label_sr ?? ""),
      labelEn: String(row.label_en ?? ""),
      checkedAt: toText(row.checked_at),
    }));

export const refreshGrowthProgress = async (): Promise<GrowthProgress> => {
  const { data } = await supabase.rpc("refresh_growth_progress").throwOnError();
  const result = (data ?? {}) as {
    missions?: Row[];
    snapshots?: Row[];
    players?: Row[];
    my_character?: unknown;
    daily_tasks?: Row[];
  };

  return {
    missions: (result.missions ?? [])
      .map(mapMission)
      .sort((a, b) => a.number - b.number),
    snapshots: (result.snapshots ?? []).map(mapSnapshot),
    players: mapPlayers(result.players ?? []),
    myCharacter: isCharacter(result.my_character) ? result.my_character : null,
    dailyTasks: mapDailyTasks(result.daily_tasks ?? []),
  };
};

/**
 * Ticks (or unticks) one of today's tasks. Only the admin who plays the task's
 * character may; anyone else gets NOT_YOUR_TASK.
 */
export const setGrowthDailyCheck = async (taskKey: string, done: boolean) => {
  await supabase
    .rpc("set_growth_daily_check", { p_task_key: taskKey, p_done: done })
    .throwOnError();
};

/** Saves (or, with an empty note, clears) an admin's note on a day's snapshot. */
export const saveGrowthNote = async (day: string, note: string) => {
  await supabase
    .rpc("set_growth_note", { p_day: day, p_note: note.trim().slice(0, GROWTH_NOTE_MAX) })
    .throwOnError();
};
