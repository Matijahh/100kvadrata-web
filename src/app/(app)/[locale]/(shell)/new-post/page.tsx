import { titleMetadata } from "@/lib/pageMetadata";
import { NewPostForm } from "./NewPostForm";

export const generateMetadata = titleMetadata("admin.newPostTitle");

export default function NewPostPage() {
  return <NewPostForm />;
}
