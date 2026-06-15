import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Server-side fallback for the Web Share Target. When the service worker is
// already controlling the page it intercepts this POST (and can stash shared
// files in the cache). When it isn't — e.g. right after install, before the new
// SW activates — the POST reaches the network instead, which would otherwise
// 404. Here we redirect into the app and forward text/url via query params.
// (Files can only be passed through the SW path; the network fallback drops them.)
function redirectInto(req: NextRequest, text: string) {
  const url = new URL("/lab/personae", req.nextUrl.origin);
  url.searchParams.set("share-target", "1");
  if (text) url.searchParams.set("t", text);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  let text = "";
  try {
    const form = await req.formData();
    text = [form.get("title"), form.get("text"), form.get("url")]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .join("\n")
      .trim();
  } catch {
    // no parseable body — still redirect rather than 404
  }
  return redirectInto(req, text);
}

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const text = [sp.get("title"), sp.get("text"), sp.get("url")]
    .filter((v): v is string => !!v)
    .join("\n")
    .trim();
  return redirectInto(req, text);
}
