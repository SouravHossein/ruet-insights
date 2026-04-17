import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_VERIFICATIONS_PER_IP = 3;

interface VerificationPayload {
  admissionRoll?: string;
  applicationId?: string | null;
  department: string;
  district: string;
  meritRank: number;
  name?: string;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getClientIp = (request: Request) => {
  const headerValue =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("fly-client-ip") ??
    request.headers.get("x-real-ip") ??
    "";
  return headerValue.split(",")[0]?.trim() || null;
};

const hashValue = async (value: string) => {
  const salt = Deno.env.get("VERIFY_IP_SALT") ?? Deno.env.get("SUPABASE_URL") ?? "ruet-insights";
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const maskContact = (value: string | null) => {
  if (!value) return null;
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `${"*".repeat(Math.max(1, digits.length - 4))}${digits.slice(-4)}`;
};

const GENERIC_ERROR = "Could not save your district. Please double-check your details and try again.";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Please sign in before verifying." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Your session is no longer valid. Please sign in again." }, 401);
    }

    const payload = (await request.json()) as VerificationPayload;
    if (!payload?.department || !payload?.district || !payload?.meritRank) {
      return jsonResponse({ error: "Incomplete verification request." }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    // One verification per user
    const { data: existingUserVerification } = await serviceClient
      .from("student_verifications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUserVerification) {
      return jsonResponse({ error: GENERIC_ERROR }, 409);
    }

    // IP throttle (silent — generic error)
    const clientIp = getClientIp(request);
    const ipHash = clientIp
      ? await hashValue(clientIp)
      : await hashValue(`missing-ip:${user.id}`);

    const { count } = await serviceClient
      .from("student_verifications")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash);

    if ((count ?? 0) >= MAX_VERIFICATIONS_PER_IP) {
      return jsonResponse({ error: GENERIC_ERROR }, 429);
    }

    // Find student by department + merit_rank (and name if provided for safety)
    let query = serviceClient
      .from("students")
      .select("id, department, district, is_locked, merit_rank, name, admission_roll")
      .eq("department", payload.department)
      .eq("merit_rank", payload.meritRank);

    if (payload.admissionRoll) {
      query = query.eq("admission_roll", payload.admissionRoll);
    }

    const { data: studentMatches, error: studentError } = await query.limit(2);
    if (studentError) throw studentError;

    let student = studentMatches && studentMatches.length === 1 ? studentMatches[0] : null;

    if (studentMatches && studentMatches.length > 1) {
      return jsonResponse({ error: GENERIC_ERROR }, 409);
    }

    // Fallback: student not yet seeded in DB — create from payload (source of truth: public roster JSON)
    if (!student) {
      if (!payload.name || !payload.admissionRoll) {
        return jsonResponse({ error: GENERIC_ERROR }, 404);
      }
      const { data: inserted, error: insertErr } = await serviceClient
        .from("students")
        .insert({
          name: payload.name,
          department: payload.department,
          merit_rank: payload.meritRank,
          admission_roll: payload.admissionRoll,
          application_id: payload.applicationId ?? null,
        })
        .select("id, department, district, is_locked, merit_rank, name, admission_roll")
        .single();
      if (insertErr || !inserted) {
        console.error("student insert failed", insertErr);
        return jsonResponse({ error: GENERIC_ERROR }, 500);
      }
      student = inserted;
    }

    if (payload.name && student.name.trim().toLowerCase() !== payload.name.trim().toLowerCase()) {
      return jsonResponse({ error: GENERIC_ERROR }, 409);
    }

    if (student.is_locked) {
      return jsonResponse({ error: GENERIC_ERROR }, 409);
    }

    const { data: existingStudentVerification } = await serviceClient
      .from("student_verifications")
      .select("id")
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingStudentVerification) {
      return jsonResponse({ error: GENERIC_ERROR }, 409);
    }

    const { error: updateError } = await serviceClient
      .from("students")
      .update({
        district: payload.district,
        is_locked: true,
        verification_status: "verified",
        verified_at: now,
      })
      .eq("id", student.id);

    if (updateError) throw updateError;

    const contactHint = maskContact(user.phone || user.email || null);
    await serviceClient.from("student_verifications").insert({
      auth_provider: String(user.app_metadata?.provider ?? "authenticated"),
      contact_hint: contactHint,
      ip_hash: ipHash,
      student_id: student.id,
      user_id: user.id,
    });

    return jsonResponse({
      student: {
        department: student.department,
        district: payload.district,
        merit_rank: student.merit_rank,
        name: student.name,
      },
    });
  } catch (error) {
    console.error("submit-verification error", error);
    return jsonResponse({ error: GENERIC_ERROR }, 500);
  }
});
