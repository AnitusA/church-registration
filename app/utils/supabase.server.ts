import { createClient } from "@supabase/supabase-js";
import { createServerClient as createRemixServerClient } from "@supabase/auth-helpers-remix";
 
export const supabase = createClient(
//   process.env.SUPABASE_URL!,
process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// For auth helpers
export function createServerClient({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) {
  return createRemixServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );
}

// export { createServetrrClient };