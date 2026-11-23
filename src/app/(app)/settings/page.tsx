import { redirect } from "next/navigation";

import { settingsNav } from "@/lib/navigation";

export default function SettingsPage() {
  redirect(settingsNav[0].href);
}
