import { redirect } from "next/navigation";

// This route existed by mistake (folder named "unauthorized.tsx").
// Permanently redirect to the correct /unauthorized route.
export default function OldUnauthorizedRedirect() {
  redirect("/unauthorized");
}
