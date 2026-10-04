// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { fetchProfile } from "@/services/profile";
import { useAuthStore } from "@/stores/useAuthStore";
import { CurrentUser } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "@/lib/queryKeys";

export const useCurrentUser = () => {
  const sessionUser = useAuthStore((state) => state.sessionUser);

  const profileQuery = useQuery({
    queryKey: sessionUser ? queryKeys.profile(sessionUser.id) : ["profile", "guest"],
    queryFn: () => fetchProfile(sessionUser!.id),
    enabled: !!sessionUser,
  });

  const currentUser = useMemo<CurrentUser | null>(() => {
    if (!sessionUser || !profileQuery.data) {
      return null;
    }

    return {
      ...profileQuery.data,
      email: sessionUser.email,
    };
  }, [profileQuery.data, sessionUser]);

  return {
    sessionUser,
    currentUser,
    profile: profileQuery.data ?? null,
    isLoadingProfile: profileQuery.isLoading,
    isFetchingProfile: profileQuery.isFetching,
    refetchProfile: profileQuery.refetch,
  };
};
