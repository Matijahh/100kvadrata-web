// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";

export type SubmitFeedbackInput = {
  userId: string;
  message: string;
  /** App version from app.json, or null if it could not be read. */
  appVersion: string | null;
  platform: string;
  /** Route the user was on when they opened the form. */
  route: string | null;
};

export const submitFeedback = async (input: SubmitFeedbackInput) => {
  await supabase
    .from("feedback")
    .insert({
      user_id: input.userId,
      message: input.message,
      app_version: input.appVersion,
      platform: input.platform,
      route: input.route,
    })
    .throwOnError();
};
