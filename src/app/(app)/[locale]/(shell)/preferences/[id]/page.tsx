import { titleMetadata } from "@/lib/pageMetadata";
import { PreferenceEditor } from "./PreferenceEditor";

export const generateMetadata = titleMetadata("preferences.title");

export default async function PreferencePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  // Keyed so moving from one set to another (or to "new") starts a fresh form.
  return <PreferenceEditor key={id} id={id} />;
}
