"use client";

import FlagIcon from "@assets/icons/flag-icon.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import {
  ReportedUserActions,
  ReportSummaryText,
  useReportedUserActions,
} from "@/components/profile/ReportedUserReview";
import { Link } from "@/i18n/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { fetchReportedUsers } from "@/services/reports";
import { formatRelativeTime } from "@/utils/relativeTime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * Users reported from a chat, the "Users" side of the admin's Flagged tab.
 * Web counterpart of the app's list: as with reported listings, the actions
 * sit on each row here, and the name opens their profile.
 */
export function ReportedUsersSection() {
  const { t } = useTranslation();
  const { askDismiss, askBlock, busyUserId } = useReportedUserActions();

  const reportedQuery = useQuery({
    queryKey: queryKeys.reportedUsers,
    queryFn: fetchReportedUsers,
    // New reports keep arriving; re-read whenever the tab is shown.
    refetchOnMount: "always",
  });

  if (reportedQuery.isLoading) return <Spinner />;
  if (reportedQuery.isError) return <EmptyState title={t("moderation.reportedUsersLoadError")} />;

  const reportedUsers = reportedQuery.data ?? [];
  if (reportedUsers.length === 0) {
    return <EmptyState icon={FlagIcon} title={t("moderation.reportedUsersEmpty")} />;
  }

  return (
    // One column: two would squeeze the summary next to the buttons.
    <ul className="grid gap-3">
      {reportedUsers.map((reported) => (
        <li
          key={reported.profile.id}
          className="flex flex-col gap-3 rounded-[24px] bg-surface p-3 sm:flex-row sm:items-center"
        >
          <Link
            href={`/user/${reported.profile.id}?from=reported`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] hover:opacity-80"
          >
            <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              <Avatar userId={reported.profile.id} avatarUrl={reported.profile.avatarUrl} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold text-text">
                {reported.profile.username}
              </span>
              <span className="block truncate text-sm text-text">
                <ReportSummaryText reported={reported} />
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                {formatRelativeTime(reported.lastReportedAt, t)}
                {reported.isBanned ? (
                  <span className="rounded-full border border-destructive px-2 py-px font-semibold text-destructive">
                    {t("moderation.bannedBadge")}
                  </span>
                ) : null}
              </span>
            </span>
          </Link>
          <ReportedUserActions
            reported={reported}
            busy={busyUserId === reported.profile.id}
            onDismiss={() => askDismiss(reported)}
            onBlock={() => askBlock(reported)}
            className="sm:shrink-0 sm:justify-end"
          />
        </li>
      ))}
    </ul>
  );
}
