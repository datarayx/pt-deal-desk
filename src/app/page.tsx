import { redirect } from "next/navigation";

// "/" goes straight to the CEO dashboard. From task 0.4 the proxy sends signed-out users to
// /login and the accountant to /finance first.
export default function Home() {
  redirect("/dashboard");
}
