import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirect /Login to /login to maintain consistency
  return redirect("/login", 301);
}

// This route won't render anything since it always redirects
export default function LoginRedirect() {
  return null;
}
