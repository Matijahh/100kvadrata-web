"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import RefreshIcon from "@assets/icons/refresh-icon.svg";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import {
  GrowthHud,
  GrowthMissionCard,
  GrowthPlayerCard,
  SpriteTile,
  pixelFrame,
} from "@/components/growth/GrowthParts";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import {
  GROWTH_METRICS,
  GROWTH_NOTE_MAX,
  refreshGrowthProgress,
  saveGrowthNote,
  setGrowthDailyCheck,
} from "@/services/growth";
import { useLanguageStore } from "@/stores/useLanguageStore";
import type { GrowthProgress, GrowthSnapshot } from "@/types/types";
import {
  GROWTH_CHARACTERS,
  buildGrowthBoard,
  formatGrowthDay,
  formatGrowthValue,
  withDailyCheck,
} from "@/utils/growthMissions";
import { formatAmount } from "@/utils/rangeLabels";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const COLLAPSED_ROWS = 14;

/**
 * "Admin igra" (Admin game), admins only. Reached from the trophy button on
 * the profile, or bookmarked at /admin-game. The seven missions belong to the
 * whole team; each team admin plays one character (profiles.admin_type) with
 * its own daily checklist, shown first. Opening it works today's numbers out again on
 * the server and saves them as today's snapshot; the database refuses anyone
 * who isn't an admin, so hiding the link is not the only guard.
 */
export function AdminGameView() {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, isLoadingProfile } = useCurrentUser();
  const isAdmin = currentUser?.isAdmin === true;
  const [editing, setEditing] = useState<GrowthSnapshot | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (!isLoadingProfile && currentUser && !isAdmin) router.replace("/profile");
  }, [currentUser, isAdmin, isLoadingProfile, router]);

  const progressKey = queryKeys.growthProgress(currentUser?.id ?? "");

  const progressQuery = useQuery({
    queryKey: progressKey,
    queryFn: refreshGrowthProgress,
    enabled: isAdmin,
    staleTime: 0,
  });

  const board = useMemo(
    () => (progressQuery.data ? buildGrowthBoard(progressQuery.data) : null),
    [progressQuery.data],
  );

  const noteMutation = useMutation({
    mutationFn: ({ day, note }: { day: string; note: string }) => saveGrowthNote(day, note),
    onSuccess: () => {
      setEditing(null);
      showToast({ type: "success", message: t("growth.noteSaved") });
      queryClient.invalidateQueries({ queryKey: progressKey });
    },
    onError: () => showToast({ type: "error", message: t("growth.noteSaveError") }),
  });

  // Ticks show at once; a failed save puts the box back and says so.
  const dailyCheckMutation = useMutation({
    mutationFn: ({ taskKey, done }: { taskKey: string; done: boolean }) => setGrowthDailyCheck(taskKey, done),
    onMutate: async ({ taskKey, done }) => {
      await queryClient.cancelQueries({ queryKey: progressKey });
      const previous = queryClient.getQueryData<GrowthProgress>(progressKey);
      if (previous) queryClient.setQueryData(progressKey, withDailyCheck(previous, taskKey, done));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(progressKey, context.previous);
      showToast({ type: "error", message: t("growth.todaySaveError") });
    },
  });

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/profile");
  };

  const header = (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={goBack}
        aria-label={t("web.listing.back")}
        className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
      >
        <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
      </button>
      <h1 className="flex-1 font-display text-2xl text-text">{t("growth.title")}</h1>
      {board ? (
        // Phones reload the page instead; the button would crowd the title.
        <div className="hidden md:block">
          <Button
            title={t("growth.refresh")}
            iconSvg={RefreshIcon}
            variant="secondary"
            onClick={() => progressQuery.refetch()}
            disabled={progressQuery.isFetching}
          />
        </div>
      ) : null}
    </div>
  );

  if (isLoadingProfile || !isAdmin || !board) {
    return (
      <div className="mx-auto w-full max-w-page px-4 pb-16 pt-4 md:px-8 md:pt-8">
        {header}
        {progressQuery.isError ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-text-muted">{t("growth.loadError")}</p>
            <Button title={t("growth.retry")} onClick={() => progressQuery.refetch()} />
          </div>
        ) : (
          <Spinner className="py-24" />
        )}
      </div>
    );
  }

  const snapshots = progressQuery.data?.snapshots ?? [];
  const historyRows = showAllHistory ? snapshots : snapshots.slice(0, COLLAPSED_ROWS);
  const parallelLabel = (numbers: number[]) =>
    numbers.length > 1
      ? `${numbers.slice(0, -1).join(", ")} ${t("growth.and")} ${numbers[numbers.length - 1]}`
      : String(numbers[0]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-4 md:px-8 md:pt-8">
      {header}

      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="flex max-w-2xl flex-col items-start gap-3">
          <span className="bg-primary px-2.5 py-1.5 font-pixel text-[11px] text-text-on-primary">
            {t("growth.world")}
          </span>
          <p className="m-0 font-pixel-text text-xl font-semibold leading-snug md:text-[22px]">
            {t("growth.lead", { count: board.missions.length, goal: formatAmount(board.listingsGoal) })}
          </p>
        </div>
        {/* Admins without a character (e.g. the test admin) see the party. */}
        {board.me ? null : (
          <div className="flex gap-2.5">
            {GROWTH_CHARACTERS.map((character) => (
              <SpriteTile key={character} character={character} width={40} className="p-1.5" />
            ))}
          </div>
        )}
      </div>

      {board.me ? (
        <div className="mb-8">
          <GrowthPlayerCard
            state={board.me}
            onToggleTask={(taskKey, done) => dailyCheckMutation.mutate({ taskKey, done })}
          />
        </div>
      ) : null}

      <GrowthHud board={board} />

      <section className="mt-12">
        <h2 className="m-0 font-pixel text-base leading-normal md:text-xl">{t("growth.missionsTitle")}</h2>
        <p className="mb-5 mt-1.5 text-text-muted">{t("growth.missionsHint")}</p>
        <div className="flex flex-col items-stretch">
          {board.stages.map((stage, index) => (
            <Fragment key={stage[0].stage}>
              {index > 0 && stage.length === 1 ? (
                <span className="my-3.5 h-2 w-2 self-center bg-primary-soft" aria-hidden />
              ) : null}
              {stage.length > 1 ? (
                <span className="my-3 self-center bg-primary px-2.5 py-0.5 text-[15px] font-semibold text-text-on-primary">
                  {t("growth.parallel", { list: parallelLabel(stage.map((mission) => mission.number)) })}
                </span>
              ) : null}
              <div className={stage.length > 1 ? "grid gap-7 md:grid-cols-2" : "grid"}>
                {stage.map((mission) => (
                  <GrowthMissionCard key={mission.number} mission={mission} />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-pixel text-base leading-normal md:text-xl">{t("growth.historyTitle")}</h2>
        <p className="mb-5 mt-1.5 text-text-muted">{t("growth.historyHint")}</p>
        <div className="m-[3px] overflow-x-auto bg-surface" style={pixelFrame("var(--c-primary-soft)")}>
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-border px-3 py-2.5 text-left font-pixel text-[10px] font-normal leading-normal text-primary">
                  {t("growth.historyDate")}
                </th>
                {GROWTH_METRICS.map((metric) => (
                  <th
                    key={metric}
                    className="border-b-2 border-border px-3 py-2.5 text-right font-pixel text-[10px] font-normal leading-normal text-primary"
                  >
                    {t(`growth.metrics.${metric}`)}
                  </th>
                ))}
                <th className="min-w-[240px] border-b-2 border-border px-3 py-2.5 text-left font-pixel text-[10px] font-normal leading-normal text-primary">
                  {t("growth.historyNote")}
                </th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((snapshot) => (
                <tr key={snapshot.day} className="align-top">
                  <td className="whitespace-nowrap border-b border-border px-3 py-2.5">
                    {formatGrowthDay(snapshot.day, language)}
                  </td>
                  {GROWTH_METRICS.map((metric) => (
                    <td key={metric} className="whitespace-nowrap border-b border-border px-3 py-2.5 text-right">
                      {formatGrowthValue(metric, snapshot.metrics[metric])}
                    </td>
                  ))}
                  <td className="border-b border-border px-3 py-2.5">
                    {snapshot.note ? (
                      <span>
                        {snapshot.note}
                        {snapshot.noteByName ? (
                          <span className="text-text-muted"> · {snapshot.noteByName}</span>
                        ) : null}{" "}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(snapshot)}
                      className="font-semibold text-primary underline"
                    >
                      {snapshot.note ? t("growth.noteEdit") : t("growth.noteAdd")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {snapshots.length > COLLAPSED_ROWS ? (
          <button
            type="button"
            onClick={() => setShowAllHistory((current) => !current)}
            className="mt-3 font-semibold text-primary underline"
          >
            {showAllHistory
              ? t("growth.showLessHistory")
              : t("growth.showAllHistory", { count: snapshots.length })}
          </button>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="m-0 font-pixel text-base leading-normal md:text-xl">{t("growth.howCounted")}</h2>
        <ul className="mt-4 grid list-none gap-2 p-0">
          {GROWTH_METRICS.map((metric) => (
            <li key={metric}>
              <b className="font-semibold">{t(`growth.metrics.${metric}`)}:</b>{" "}
              {t(`growth.metricHints.${metric}`)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-text-muted">{t("growth.leftOut")}</p>
      </section>

      <GrowthNoteDialog
        snapshot={editing}
        isSaving={noteMutation.isPending}
        onClose={() => setEditing(null)}
        onSave={(note) => {
          if (editing) noteMutation.mutate({ day: editing.day, note });
        }}
      />
    </div>
  );
}

function GrowthNoteDialog({
  snapshot,
  isSaving,
  onClose,
  onSave,
}: {
  snapshot: GrowthSnapshot | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(snapshot?.note ?? "");
  }, [snapshot]);

  return (
    <Modal
      open={!!snapshot}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={snapshot ? t("growth.noteTitle", { date: formatGrowthDay(snapshot.day, language) }) : ""}
    >
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isSaving) onSave(note);
        }}
      >
        <LabeledTextField
          label={t("growth.historyNote")}
          placeholder={t("growth.notePlaceholder")}
          value={note}
          onChangeText={setNote}
          maxLength={GROWTH_NOTE_MAX}
          disabled={isSaving}
          autoFocus
        />
        <Button type="submit" title={t("growth.noteSave")} disabled={isSaving} fullWidth className="mt-4" />
      </form>
    </Modal>
  );
}
