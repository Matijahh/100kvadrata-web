// localStorage keys owned by the web app. Kept free of store code so server
// components (the pre-paint theme script) can import them.

/** Read by the inline theme script in <ThemeTokens /> before first paint. */
export const THEME_STORAGE_KEY = "100m2.theme";

/** Feed layout on desktop: "reel" (default) or "grid". */
export const FEED_LAYOUT_STORAGE_KEY = "100m2.feedLayout";

/** When the mobile "get the app" prompt was last dismissed (epoch ms). */
export const APP_PROMPT_DISMISSED_KEY = "100m2.appPromptDismissedAt";
