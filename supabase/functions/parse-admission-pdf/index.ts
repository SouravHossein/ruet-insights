import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let text = "";

    if (
      contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("multipart/form-data")
    ) {
      // Binary PDF upload - we'll extract text from the raw content
      const arrayBuffer = await req.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      text = extractTextFromPdf(bytes);
    } else {
      // Assume JSON with text content or CSV
      const body = await req.json();
      text = body.text || body.content || "";
    }

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No parseable content found in the uploaded file. Please try uploading as CSV instead." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const students = parseAdmissionText(text);

    return new Response(
      JSON.stringify({ students, count: students.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ParsedStudent {
  sl: string;
  application_id: string;
  admission_roll: string;
  name: string;
  merit_rank: number;
  department: string;
}

function extractTextFromPdf(bytes: Uint8Array): string {
  // Simple PDF text extraction - looks for text between BT/ET markers
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(bytes);
  
  const textChunks: string[] = [];
  
  // Extract text from PDF stream objects
  // Look for text between parentheses in BT...ET blocks
  const btEtRegex = /BT\s*([\s\S]*?)ET/g;
  let match;
  
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    // Extract text in parentheses (Tj operator)
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textChunks.push(tjMatch[1]);
    }
    // Extract text arrays (TJ operator)
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/gi;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const innerTexts = arrMatch[1].match(/\(([^)]*)\)/g);
      if (innerTexts) {
        textChunks.push(innerTexts.map(t => t.slice(1, -1)).join(""));
      }
    }
  }
  
  return textChunks.join("\n");
}

function parseAdmissionText(text: string): ParsedStudent[] {
  const students: ParsedStudent[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try to detect CSV format
  if (lines[0] && lines[0].includes(",")) {
    return parseCsv(lines);
  }

  // Try to parse structured text (from PDF)
  // Pattern: Sl | Application ID | Admission Roll | Name | Merit | Department
  const rowPattern = /(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s+(\d+)\s+(.+)/;

  for (const line of lines) {
    const match = line.match(rowPattern);
    if (match) {
      students.push({
        sl: match[1],
        application_id: match[2],
        admission_roll: match[3],
        name: match[4].trim(),
        merit_rank: parseInt(match[5]),
        department: match[6].trim(),
      });
    }
  }

  return students;
}

function parseCsv(lines: string[]): ParsedStudent[] {
  const students: ParsedStudent[] = [];
  // Skip header
  const header = lines[0].toLowerCase();
  const startIdx = header.includes("sl") || header.includes("name") ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length >= 5) {
      students.push({
        sl: cols[0],
        application_id: cols[1] || "",
        admission_roll: cols[2] || cols[1],
        name: cols[3] || cols[2],
        merit_rank: parseInt(cols[4] || cols[3]) || i,
        department: cols[5] || cols[4] || "Unknown",
      });
    }
  }

  return students;
}
