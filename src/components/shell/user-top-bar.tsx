import { TopBar } from "@/components/shell/top-bar";
import { requireUser } from "@/lib/auth/session";

// Top bar for the signed-in user (name, role, role-filtered ⌘K and drawer).
// Async (reads the session), so it renders inside <Suspense> in the app layout.
export async function UserTopBar() {
  const user = await requireUser();
  return <TopBar user={{ name: user.name, email: user.email, role: user.role }} />;
}
