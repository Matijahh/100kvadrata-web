// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import {
  AppLanguage,
  GrowthCharacter,
  GrowthCriterion,
  GrowthDailyTask,
  GrowthMetrics,
  GrowthMission,
  GrowthPlayer,
  GrowthProgress,
  GrowthSnapshot,
} from "@/types/types";
import { formatAmount } from "@/utils/rangeLabels";

/**
 * Everything the "Admin igra" screen shows, worked out once from what the
 * database returned, so the app and the web draw the same board.
 */

/** Blocks in the XP bar. */
export const GROWTH_XP_BLOCKS = 50;

/** Used for the bar's end when no mission has a listings target. */
const FALLBACK_LISTINGS_GOAL = 2500;

const ZERO_METRICS: GrowthMetrics = {
  active_listings: 0,
  active_advertisers: 0,
  municipalities: 0,
  conversations: 0,
  buyer_requests: 0,
  fresh_listings_pct: 0,
};

export type GrowthCriterionState = GrowthCriterion & {
  current: number;
  isMet: boolean;
  /** 0-1, for the progress bar. */
  ratio: number;
};

export type GrowthMissionState = GrowthMission & {
  isWon: boolean;
  isNext: boolean;
  /** Carried by the signed-in admin's character. */
  isMine: boolean;
  criteriaState: GrowthCriterionState[];
};

export type GrowthFlag = {
  missionNumber: number;
  target: number;
  /** 0-1 along the XP bar. */
  position: number;
  isWon: boolean;
};

export type GrowthCharacterState = {
  character: GrowthCharacter;
  /** The admin who plays it, if anyone. */
  player: GrowthPlayer | null;
  /** The signed-in admin plays it. */
  isMine: boolean;
  missions: GrowthMissionState[];
  wonCount: number;
  /** Its first mission not won yet. */
  nextMission: GrowthMissionState | null;
  /** Today's checklist, in order. */
  dailyTasks: GrowthDailyTask[];
  /** How many of today's tasks are ticked. */
  dailyDone: number;
};

export type GrowthBoard = {
  latest: GrowthSnapshot | null;
  metrics: GrowthMetrics;
  missions: GrowthMissionState[];
  /** Missions grouped by stage, in order; a stage with 2+ runs side by side. */
  stages: GrowthMissionState[][];
  nextMission: GrowthMissionState | null;
  wonCount: number;
  /** The highest listings target: the end of the XP bar. */
  listingsGoal: number;
  listingsPerBlock: number;
  filledBlocks: number;
  flags: GrowthFlag[];
  /** The signed-in admin's character first, then the others. */
  characters: GrowthCharacterState[];
  /** The signed-in admin's character, or null when they don't play one. */
  me: GrowthCharacterState | null;
  /** First name of whoever plays each character ("Stefan"). */
  playerNames: Partial<Record<GrowthCharacter, string>>;
};

export const GROWTH_CHARACTERS: readonly GrowthCharacter[] = ["bard", "herald", "host"];

export const buildGrowthBoard = (progress: GrowthProgress): GrowthBoard => {
  const latest = progress.snapshots[0] ?? null;
  const metrics = latest?.metrics ?? ZERO_METRICS;
  const firstOpen = progress.missions.find((mission) => !mission.wonOn);

  const myCharacter = progress.myCharacter;

  const missions: GrowthMissionState[] = progress.missions.map((mission) => ({
    ...mission,
    isWon: !!mission.wonOn,
    isNext: mission === firstOpen,
    isMine: !!myCharacter && mission.carriers.includes(myCharacter),
    criteriaState: mission.criteria.map((criterion) => {
      const current = metrics[criterion.metric] ?? 0;
      return {
        ...criterion,
        current,
        isMet: current >= criterion.target,
        ratio: criterion.target > 0 ? Math.min(1, current / criterion.target) : 1,
      };
    }),
  }));

  const stageNumbers = [...new Set(missions.map((mission) => mission.stage))].sort(
    (a, b) => a - b,
  );
  const stages = stageNumbers.map((stage) =>
    missions.filter((mission) => mission.stage === stage),
  );

  const listingTargets = missions.flatMap((mission) =>
    mission.criteria
      .filter((criterion) => criterion.metric === "active_listings" && criterion.target > 0)
      .map((criterion) => ({ mission, target: criterion.target })),
  );
  const listingsGoal = listingTargets.length
    ? Math.max(...listingTargets.map((item) => item.target))
    : FALLBACK_LISTINGS_GOAL;
  const listingsPerBlock = listingsGoal / GROWTH_XP_BLOCKS;
  const filledBlocks = Math.floor(
    Math.min(metrics.active_listings, listingsGoal) / listingsPerBlock,
  );

  const flags = listingTargets.map(({ mission, target }) => ({
    missionNumber: mission.number,
    target,
    position: target / listingsGoal,
    isWon: mission.isWon,
  }));

  const characters: GrowthCharacterState[] = GROWTH_CHARACTERS.map((character) => {
    const carried = missions.filter((mission) => mission.carriers.includes(character));
    const dailyTasks = progress.dailyTasks.filter((task) => task.character === character);
    return {
      character,
      player: progress.players.find((player) => player.character === character) ?? null,
      isMine: character === myCharacter,
      missions: carried,
      wonCount: carried.filter((mission) => mission.isWon).length,
      nextMission: carried.find((mission) => !mission.isWon) ?? null,
      dailyTasks,
      dailyDone: dailyTasks.filter((task) => task.checkedAt).length,
    };
  }).sort((a, b) => Number(b.isMine) - Number(a.isMine));

  return {
    latest,
    metrics,
    missions,
    stages,
    nextMission: missions.find((mission) => mission.isNext) ?? null,
    wonCount: missions.filter((mission) => mission.isWon).length,
    listingsGoal,
    listingsPerBlock,
    filledBlocks,
    flags,
    characters,
    me: characters.find((state) => state.isMine) ?? null,
    playerNames: Object.fromEntries(
      progress.players
        .filter((player) => player.name)
        .map((player) => [player.character, player.name as string]),
    ),
  };
};

/** "Glasnik (Stefan), Domaćin (Aleksa)": a mission's carriers with who plays them. */
export const formatCarriers = (
  mission: GrowthMission,
  playerNames: GrowthBoard["playerNames"],
  characterName: (character: GrowthCharacter) => string,
) =>
  mission.carriers
    .map((character) => {
      const player = playerNames[character];
      return player ? `${characterName(character)} (${player})` : characterName(character);
    })
    .join(", ");

export const getMissionName = (mission: GrowthMission, language: AppLanguage) =>
  language === "en" ? mission.nameEn : mission.nameSr;

export const getDailyTaskLabel = (task: GrowthDailyTask, language: AppLanguage) =>
  language === "en" ? task.labelEn : task.labelSr;

/** The progress with one of today's tasks ticked or unticked (optimistic update). */
export const withDailyCheck = (
  progress: GrowthProgress,
  taskKey: string,
  done: boolean,
): GrowthProgress => ({
  ...progress,
  dailyTasks: progress.dailyTasks.map((task) =>
    task.key === taskKey
      ? { ...task, checkedAt: done ? task.checkedAt ?? new Date().toISOString() : null }
      : task,
  ),
});

export const getMissionReward = (mission: GrowthMission, language: AppLanguage) =>
  language === "en" ? mission.rewardEn : mission.rewardSr;

/** "0042" — the arcade score, four digits like the artifact. */
export const formatGrowthScore = (value: number) =>
  String(Math.min(Math.max(0, Math.round(value)), 9999)).padStart(4, "0");

/** "1.000", or "70%" for the fresh-listings share. */
export const formatGrowthValue = (metric: keyof GrowthMetrics, value: number) =>
  metric === "fresh_listings_pct" ? `${Math.round(value)}%` : formatAmount(value);

/** "01" */
export const formatMissionNumber = (value: number) => String(value).padStart(2, "0");

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A YYYY-MM-DD day: "24. 11. 2026." in Serbian, "24 Nov 2026" in English. */
export const formatGrowthDay = (day: string, language: AppLanguage) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const [, year, month, date] = match;
  return language === "en"
    ? `${Number(date)} ${EN_MONTHS[Number(month) - 1]} ${year}`
    : `${Number(date)}. ${Number(month)}. ${year}.`;
};

/** "14:05", local time, for when today's numbers were worked out. */
export const formatGrowthTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
