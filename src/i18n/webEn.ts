// Copy that exists only on the web (app prompts, layout toggles, ...). Merged
// under the `web` key next to the dictionaries synced from the mobile app, so
// components use `t("web.…")`. Not synced — owned by this repo. Keep the keys
// in step with webSr.ts.
export const webEn = {
  common: {
    close: "Close",
  },
  editProfile: {
    photoHint: "Drop a photo here, or click to choose one.",
    about: "About you",
    contact: "Contact",
    agencyAndLinks: "Agency and links",
    links: "Links",
  },
  nav: {
    main: "Main navigation",
    loanCalculator: "Loan calculator",
    website: "Website",
  },
  auth: {
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  titles: {
    login: "Log in",
    register: "Create account",
    verifyEmail: "Verify your email",
    forgotPassword: "Reset password",
    updatePassword: "New password",
    chooseUsername: "Choose a username",
    onboarding: "Welcome",
  },
  listing: {
    back: "Back",
    like: "Like",
    save: "Save",
    message: "Message",
    share: "Share",
    report: "Report",
    linkCopied: "Link copied",
    chatFailed: "We couldn't open the chat right now.",
    playVideo: "Play video",
    openInApp: "Open in the app",
    expiredNotice: "This listing has expired and is no longer shown in the feed.",
    notFoundTitle: "Listing not found",
    notFoundMessage: "It may have been removed by its owner.",
    browseListings: "Browse listings",
    roomsShort: "rooms",
    ownerTools: "Your listing",
  },
  newListing: {
    editTitle: "Edit listing",
    dropzoneTitle: "Drag photos or a video here",
    dropzoneHint: "or click to choose files — up to 15 photos, or one video",
    dropzoneActive: "Drop to add",
    reorderHint: "Drag to change the order. The first photo is the cover.",
    cover: "Cover",
    compressingVideo: "Preparing video… {{percent}}%",
    uploadingMedia: "Uploading…",
    unsupportedFile: "That file type isn't supported.",
    leaveWarning: "Your listing isn't published yet. Leave anyway?",
    next: "Next",
  },
  getApp: {
    title: "100m² feels best in the app",
    message:
      "Swiping, instant notifications and video are smoother in the app. It's free.",
    appStore: "Download on the App Store",
    googlePlay: "Get it on Google Play",
  },
  feed: {
    tabsLabel: "What to browse",
    filters: "Filters",
    details: "Details",
    openListing: "Open listing page",
    mute: "Mute",
    unmute: "Turn sound on",
    previous: "Previous listing",
    next: "Next listing",
    endOfFeed: "You've seen everything here.",
  },
  chat: {
    selectConversation: "Pick a conversation to read it here.",
    attach: "Add photos or videos",
    removeAttachment: "Remove",
    removeListing: "Remove the listing link",
    notFound: "This conversation doesn't exist, or you're not part of it.",
    moderation: "Report or block",
    backToInbox: "Back to messages",
    enterHint: "Enter to send, Shift + Enter for a new line",
    playVideo: "Play video",
    closeViewer: "Close",
    sending: "Sending…",
  },
};

export type WebDictionary = typeof webEn;
