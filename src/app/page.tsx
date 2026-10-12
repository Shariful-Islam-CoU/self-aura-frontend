import { redirect } from "next/navigation";

// The root route is a landing convenience: dashboards and data are behind the
// authenticated (dashboard) layout, so unauthenticated visits redirect to
// /login via middleware and any reach through here goes to the dashboard.
export default function Home() {
  redirect("/dashboard");
}