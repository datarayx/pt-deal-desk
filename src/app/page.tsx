import { redirect } from "next/navigation";

// The proxy sends "/" to the signed-in user's home (CEO → /dashboard, Accountant → /finance) or
// to /login. This redirect is only a fallback.
export default function Home() {
  redirect("/login");
}
