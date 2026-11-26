"use client";

import {
  GROWTH_SPRITES,
  GROWTH_SPRITE_HEIGHT,
  GROWTH_SPRITE_TILE,
  GROWTH_SPRITE_WIDTH,
  GROWTH_TROPHY,
  GROWTH_TROPHY_SIZE,
} from "@/constants/growthSprites";
import { cn } from "@/lib/cn";
import { useLanguageStore } from "@/stores/useLanguageStore";
import type { GrowthCharacter } from "@/types/types";
import {
  GROWTH_XP_BLOCKS,
  type GrowthBoard,
  type GrowthCharacterState,
  type GrowthMissionState,
  formatGrowthDay,
  getDailyTaskLabel,
  formatGrowthScore,
  formatGrowthTime,
  formatGrowthValue,
  formatMissionNumber,
  getMissionName,
} from "@/utils/growthMissions";
import { formatAmount } from "@/utils/rangeLabels";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

/**
 * The pieces of the admin-only "Admin igra" page. Same board as the app
 * (utils/growthMissions works it out for both); here the panels get the
 * notched pixel frame from the original design.
 */

/** A square-cornered pixel frame drawn outside the box (keep `m-[3px]`). */
export const pixelFrame = (color: string, width = 3): CSSProperties => ({
  boxShadow: `0 -${width}px 0 0 ${color}, 0 ${width}px 0 0 ${color}, -${width}px 0 0 0 ${color}, ${width}px 0 0 0 ${color}`,
});

export function GrowthSprite({
  character,
  width,
}: {
  character: GrowthCharacter;
  width: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${GROWTH_SPRITE_WIDTH} ${GROWTH_SPRITE_HEIGHT}`}
      width={width}
      height={(width * GROWTH_SPRITE_HEIGHT) / GROWTH_SPRITE_WIDTH}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {GROWTH_SPRITES[character].map((layer) => (
        <path key={layer.fill} fill={layer.fill} d={layer.d} />
      ))}
    </svg>
  );
}

/** The boss missions' pixel trophy, `size` pixels square. */
export function GrowthTrophy({ size }: { size: number }) {
  return (
    <svg
      viewBox={`0 0 ${GROWTH_TROPHY_SIZE} ${GROWTH_TROPHY_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {GROWTH_TROPHY.map((layer) => (
        <path key={layer.fill} fill={layer.fill} d={layer.d} />
      ))}
    </svg>
  );
}

export function SpriteTile({
  character,
  width,
  className,
}: {
  character: GrowthCharacter;
  width: number;
  className?: string;
}) {
  return (
    <span className={cn("grid place-items-center", className)} style={{ backgroundColor: GROWTH_SPRITE_TILE }}>
      <GrowthSprite character={character} width={width} />
    </span>
  );
}

export function GrowthHud({ board }: { board: GrowthBoard }) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { latest, metrics, nextMission } = board;

  const stats = [
    { label: t("growth.wonMissions"), value: `${board.wonCount} / ${board.missions.length}` },
    {
      label: t("growth.nextGoal"),
      value: nextMission
        ? t("growth.nextGoalValue", {
            number: nextMission.number,
            name: getMissionName(nextMission, language),
          })
        : t("growth.allWon"),
    },
    {
      label: t("growth.updatedAt"),
      value: latest
        ? `${formatGrowthDay(latest.day, language)} · ${t("growth.updatedAtValue", {
            time: formatGrowthTime(latest.computedAt),
          })}`
        : "—",
    },
  ];

  return (
    <div className="m-[3px] bg-surface p-5 md:p-7" style={pixelFrame("var(--c-primary)")}>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-end">
        <div>
          <p className="font-pixel text-[11px] leading-4 text-primary">{t("growth.scoreLabel")}</p>
          <p className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="font-pixel text-[44px] leading-none text-primary md:text-[72px]">
              {formatGrowthScore(metrics.active_listings)}
            </span>
            <span className="font-pixel text-base md:text-xl">/ {formatAmount(board.listingsGoal)}</span>
          </p>
        </div>
        <dl className="m-0 grid gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex justify-between gap-3 border-b-2 border-dashed border-border pb-1.5">
              <dt className="shrink-0 text-text-muted">{stat.label}</dt>
              <dd className="m-0 text-right font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="font-pixel text-[11px] leading-4 text-primary">{t("growth.xpLabel")}</span>
          <span className="text-sm text-text-muted">
            {t("growth.xpHint", { per: formatAmount(board.listingsPerBlock) })}
          </span>
        </div>
        <div className="relative mx-[9px] mb-1.5 mt-2.5 h-[54px]">
          {board.flags.map((flag) => {
            const key = `${flag.missionNumber}-${flag.target}`;
            const place = {
              left: `${flag.position * 100}%`,
              transform: flag.position >= 1 ? "translateX(-100%)" : "translateX(-50%)",
            };
            // The bosses' flags are their trophies on the sprites' tile (so the
            // outline shows in dark mode too), dimmed until beaten.
            return flag.boss ? (
              <span
                key={key}
                title={`${t("growth.missionsTitle")} ${flag.missionNumber} · ${t(
                  flag.boss === "final" ? "growth.bossFinal" : "growth.bossMini",
                )}`}
                className={cn("absolute bottom-0 flex p-[3px]", !flag.isWon && "opacity-50")}
                style={{ ...place, backgroundColor: GROWTH_SPRITE_TILE }}
              >
                <GrowthTrophy size={flag.boss === "final" ? 48 : 32} />
              </span>
            ) : (
              <span
                key={key}
                title={`${t("growth.missionsTitle")} ${flag.missionNumber}`}
                className={cn(
                  "absolute bottom-0 grid h-[26px] w-[26px] place-items-center font-pixel text-[10px]",
                  flag.isWon ? "bg-primary text-text-on-primary" : "bg-surface text-primary",
                )}
                style={{ ...place, boxShadow: "inset 0 0 0 2px var(--c-primary)" }}
              >
                {flag.missionNumber}
              </span>
            );
          })}
        </div>
        <div
          role="img"
          aria-label={t("growth.xpAccessibility", {
            current: formatAmount(metrics.active_listings),
            goal: formatAmount(board.listingsGoal),
          })}
          className="m-[3px] grid gap-px bg-surface p-1 md:gap-[3px] md:p-1.5"
          style={{ gridTemplateColumns: `repeat(${GROWTH_XP_BLOCKS}, minmax(0, 1fr))`, ...pixelFrame("var(--c-text)") }}
        >
          {Array.from({ length: GROWTH_XP_BLOCKS }, (_, index) => (
            <i
              key={index}
              className={cn("block h-[22px] md:h-[34px]", index < board.filledBlocks ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
        <div className="mt-2.5 flex justify-between font-pixel text-[11px]">
          <span>0</span>
          <span>{formatAmount(board.listingsGoal)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * One mission, shared by the whole team: its targets against today's numbers.
 * The two bosses also show their reward under a pixel trophy, a small one for
 * the mini boss and a big one for the final boss.
 */
export function GrowthMissionCard({ mission }: { mission: GrowthMissionState }) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const won = mission.isWon;

  return (
    <article
      className={cn("m-[3px] flex flex-col gap-2.5 px-5 py-4", won ? "bg-primary text-text-on-primary" : "bg-surface")}
      style={pixelFrame(won || mission.isNext ? "var(--c-primary)" : "var(--c-primary-soft)")}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={cn(
            "px-2 py-1.5 font-pixel text-[13px]",
            won ? "bg-text-on-primary text-primary" : "bg-primary text-text-on-primary",
          )}
        >
          {formatMissionNumber(mission.number)}
        </span>
        {mission.boss ? (
          <span className={cn("px-2 py-1.5 font-pixel text-[10px]", won ? "bg-text-on-primary text-primary" : "bg-text text-surface")}>
            {t(mission.boss === "final" ? "growth.bossFinal" : "growth.bossMini")}
          </span>
        ) : null}
        <h3 className="m-0 flex-auto font-pixel-text text-xl font-semibold leading-tight">
          {getMissionName(mission, language)}
        </h3>
        {won && mission.wonOn ? (
          <span className="whitespace-nowrap bg-text-on-primary px-2 py-1.5 font-pixel text-[10px] text-primary">
            {t("growth.wonOn", { date: formatGrowthDay(mission.wonOn, language) })}
          </span>
        ) : mission.isNext ? (
          <span className="whitespace-nowrap bg-primary px-2 py-1.5 font-pixel text-[10px] text-text-on-primary">
            {t("growth.next")}
          </span>
        ) : null}
      </div>

      <ul className="m-0 grid list-none gap-1.5 p-0">
        {mission.criteriaState.map((criterion) => (
          <li
            key={criterion.metric}
            className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 md:grid-cols-[16px_minmax(0,1fr)_auto_minmax(60px,140px)]"
          >
            <span
              className="h-4 w-4"
              style={{
                boxShadow: "inset 0 0 0 2px currentColor",
                backgroundColor: criterion.isMet ? "currentColor" : undefined,
              }}
            />
            <span>
              {t(`growth.metrics.${criterion.metric}`)}
              <span className="sr-only">, {t(criterion.isMet ? "growth.met" : "growth.notMet")}</span>
            </span>
            <span className="whitespace-nowrap text-right font-semibold">
              {formatGrowthValue(criterion.metric, criterion.current)} /{" "}
              {formatGrowthValue(criterion.metric, criterion.target)}
            </span>
            <span className={cn("col-start-2 col-end-[-1] h-2.5 md:col-auto", won ? "bg-primary-soft" : "bg-border")}>
              <i
                className={cn("block h-full", won ? "bg-text-on-primary" : "bg-primary")}
                style={{ width: `${Math.round(criterion.ratio * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      {mission.boss ? (
        <div
          className={cn(
            "mt-1 flex items-center gap-4 border-t-2 border-dashed pt-3.5",
            won ? "border-primary-soft" : "border-border",
          )}
        >
          <span className="grid shrink-0 place-items-center p-2" style={{ backgroundColor: GROWTH_SPRITE_TILE }}>
            <GrowthTrophy size={mission.boss === "final" ? 80 : 48} />
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={cn("font-pixel text-[10px] leading-4", won ? "text-text-on-primary" : "text-primary")}>
              {t("growth.bossReward")}
            </span>
            <span
              className={cn(
                "font-pixel-text font-semibold leading-snug",
                mission.boss === "final" ? "text-2xl" : "text-lg",
              )}
            >
              {t(`growth.bossRewards.${mission.boss}`)}
            </span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/**
 * "You play as Lovac": the signed-in admin's own character, at the top, with
 * today's checklist they tick off. Missions are shared by the whole team, so
 * the card has none of its own.
 */
export function GrowthPlayerCard({
  state,
  onToggleTask,
}: {
  state: GrowthCharacterState;
  onToggleTask: (taskKey: string, done: boolean) => void;
}) {
  const { t } = useTranslation();
  const language = useLanguageStore((store) => store.language);
  const key = `growth.characters.${state.character}`;

  return (
    <section
      className="m-[3px] grid gap-5 bg-surface p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:p-6"
      style={pixelFrame("var(--c-primary)")}
    >
      <SpriteTile character={state.character} width={96} className="justify-self-start p-3" />
      <div className="flex flex-col gap-3">
        <div>
          <p className="m-0 font-pixel text-[10px] leading-4 text-primary">{t("growth.playingAs")}</p>
          <h2 className="mb-0 mt-2 font-pixel text-2xl leading-snug">{t(`${key}.name`)}</h2>
        </div>
        <p className="m-0 bg-primary px-3 py-2.5 font-pixel-text text-lg font-semibold leading-snug text-text-on-primary">
          {t(`${key}.power`)}
        </p>

        {state.dailyTasks.length ? (
          <fieldset className="m-0 flex flex-col gap-2.5 border-2 border-primary-soft bg-surface-muted p-3.5">
            <legend className="sr-only">{t("growth.todayTasks")}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2" aria-hidden>
              <span className="font-pixel text-[10px] leading-4 text-primary">{t("growth.todayTasks")}</span>
              <span className="text-sm font-semibold">
                {state.dailyDone === state.dailyTasks.length
                  ? t("growth.todayAllDone")
                  : t("growth.todayCount", { done: state.dailyDone, total: state.dailyTasks.length })}
              </span>
            </div>
            {state.dailyTasks.map((task) => {
              const done = !!task.checkedAt;
              return (
                <label key={task.key} className="flex min-h-8 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggleTask(task.key, !done)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-[22px] w-[22px] shrink-0 place-items-center text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                      done ? "bg-primary text-text-on-primary" : "text-transparent",
                    )}
                    style={{ boxShadow: "inset 0 0 0 2px var(--c-primary)" }}
                  >
                    ✓
                  </span>
                  <span className={cn("text-[15px]", done && "text-text-muted line-through")}>
                    {getDailyTaskLabel(task, language)}
                  </span>
                </label>
              );
            })}
            <p className="m-0 text-xs text-text-muted">{t("growth.todayTasksHint")}</p>
          </fieldset>
        ) : null}
      </div>
    </section>
  );
}
