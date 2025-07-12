import { redirect } from "@remix-run/node";
import { createServerClient } from "~/lib/supabase.server";

export interface User {
  id: string;
  email: string;
  role: "organizer" | "secretary";
  name?: string;
  church?: string;
}

export async function requireOrganizerRole(request: Request): Promise<User> {
  const authHeader = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");
  
  if (!authHeader && !cookie) {
    throw redirect("/login");
  }

  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  
  try {
    const supabase = createServerClient(token || undefined);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw redirect("/login");
    }

    // Check if user has organizer role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name, church")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw redirect("/login");
    }

    if (profile.role !== "organizer") {
      throw redirect("/unauthorized");
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
      name: profile.name,
      church: profile.church,
    };
  } catch (error) {
    throw redirect("/login");
  }
}

export async function requireSecretaryRole(request: Request): Promise<User> {
  const authHeader = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");
  
  if (!authHeader && !cookie) {
    throw redirect("/login");
  }

  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  
  try {
    const supabase = createServerClient(token || undefined);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw redirect("/login");
    }

    // Check if user has secretary role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name, church")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw redirect("/login");
    }

    if (profile.role !== "secretary") {
      throw redirect("/unauthorized");
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
      name: profile.name,
      church: profile.church,
    };
  } catch (error) {
    throw redirect("/login");
  }
}

export async function getCurrentUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");
  
  if (!authHeader && !cookie) {
    return null;
  }

  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  
  try {
    const supabase = createServerClient(token || undefined);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name, church")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
      name: profile.name,
      church: profile.church,
    };
  } catch (error) {
    return null;
  }
}
