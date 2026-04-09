import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_VERIFICATIONS_PER_IP = 3;

interface VerificationPayload {
  admissionRoll: string;
  applicationId?: string | null;
  department: string;
  district: string;
  meritRank: number;
  name: string;
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
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Your session is no longer valid. Please sign in again." }, 401);
    }

    const payload = (await request.json()) as VerificationPayload;
    if (
      !payload?.admissionRoll ||
      !payload?.name ||
      !payload?.department ||
      !payload?.district ||
      !payload?.meritRank
    ) {
      return jsonResponse({ error: "Incomplete verification request." }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    const { data: existingUserVerification, error: existingUserVerificationError } =
      await serviceClient
        .from("student_verifications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingUserVerificationError) {
      throw existingUserVerificationError;
    }

    if (existingUserVerification) {
      return jsonResponse(
        {
          error:
            "This Google or phone account already verified one RUET student. Please sign in with the original account if you need to view the same submission again.",
        },
        409,
      );
    }

    const clientIp = getClientIp(request);
    const ipHash = clientIp
      ? await hashValue(clientIp)
      : await hashValue(`missing-ip:${user.id}`);

    const { count, error: ipCountError } = await serviceClient
      .from("student_verifications")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash);

    if (ipCountError) {
      throw ipCountError;
    }

    if ((count ?? 0) >= MAX_VERIFICATIONS_PER_IP) {
      return jsonResponse(
        {
          error:
            "Too many verifications have already been submitted from this connection. If you are on shared Wi-Fi, try mobile data or another trusted network and try again.",
        },
        429,
      );
    }

    const { data: existingStudent, error: existingStudentError } = await serviceClient
      .from("students")
      .select("id, district, is_locked, merit_rank, name, department")
      .eq("admission_roll", payload.admissionRoll)
      .maybeSingle();

    if (existingStudentError) {
      throw existingStudentError;
    }

    if (existingStudent?.is_locked) {
      return jsonResponse(
        {
          error: `This admission record is already locked with ${existingStudent.district ?? "a saved district"}.`,
        },
        409,
      );
    }

    let studentId = existingStudent?.id ?? null;

    if (studentId) {
      const { error: updateError } = await serviceClient
        .from("students")
        .update({
          application_id: payload.applicationId ?? null,
          department: payload.department,
          district: payload.district,
          is_locked: true,
          merit_rank: payload.meritRank,
          name: payload.name,
          verification_status: "verified",
          verified_at: now,
        })
        .eq("id", studentId);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { data: insertedStudent, error: insertError } = await serviceClient
        .from("students")
        .insert({
          admission_roll: payload.admissionRoll,
          application_id: payload.applicationId ?? null,
          department: payload.department,
          district: payload.district,
          is_locked: true,
          merit_rank: payload.meritRank,
          name: payload.name,
          verification_status: "verified",
          verified_at: now,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      studentId = insertedStudent.id;
    }

    const contactHint = maskContact(user.phone || user.email || null);
    const { error: auditInsertError } = await serviceClient
      .from("student_verifications")
      .insert({
        auth_provider: String(user.app_metadata?.provider ?? "authenticated"),
        contact_hint: contactHint,
        ip_hash: ipHash,
        student_id: studentId,
        user_id: user.id,
      });

    if (auditInsertError) {
      throw auditInsertError;
    }

    return jsonResponse({
      student: {
        department: payload.department,
        district: payload.district,
        merit_rank: payload.meritRank,
        name: payload.name,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Verification failed unexpectedly.",
      },
      500,
    );
  }
});
