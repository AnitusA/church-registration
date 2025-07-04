import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// Get server-side environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in environment variables"
  );
}

// Regular Supabase client for server-side usage
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

// Auth helpers version
export function createSupabaseServerClient({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) {
  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      get(key: string) {
        const cookie = request.headers.get("cookie");
        const value = cookie?.split(";").find((c) => c.trim().startsWith(`${key}=`));
        return value?.split("=")[1];
      },
      set(key: string, value: string, options: any) {
        response.headers.append("Set-Cookie", `${key}=${value}; ${options}`);
      },
      remove(key: string, options: any) {
        response.headers.append("Set-Cookie", `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options}`);
      },
    },
  });
}