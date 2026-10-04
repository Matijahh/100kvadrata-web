// localStorage keys owned by the web app. Kept free of store code so server
// components (the pre-paint theme script) can import them.

/** Read by the inline theme script in <ThemeTokens /> before first paint. */
export const THEME_STORAGE_KEY = "100m2.theme";

/** Whether the desktop feed's filter panel is expanded ("1") or collapsed ("0"). */
export const FEED_FILTERS_OPEN_STORAGE_KEY = "100m2.feedFiltersOpen";

/** When the mobile "get the app" prompt was last dismissed (epoch ms). */
export const APP_PROMPT_DISMISSED_KEY = "100m2.appPromptDismissedAt";
