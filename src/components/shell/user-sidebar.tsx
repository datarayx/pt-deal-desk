import { AppSidebar } from "@/components/shell/app-sidebar";
import { homeFor } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";

// Sidebar for the signed-in user: only the pages their role can open (task 0.5).
// Async (reads the session), so it renders inside <Suspense> in the app layout.
export async function UserSidebar() {
  const user = await requireUser();
  return <AppSidebar role={user.role} homeHref={homeFor(user.role)} />;
}
