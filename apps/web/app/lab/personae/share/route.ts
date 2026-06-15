import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Files larger than this aren't embedded in the HTML fallback (Vercel response
// size limit). The SW path has no such limit; this only bounds the cold-start
// fallback when no service worker is controlling the page yet.
const EMBED_LIMIT = 3 * 1024 * 1024;

const SHARE_PAGE = "/lab/personae?share-target=1";

function redirectInto(req: NextRequest, text: string, hadFile = false) {
  const url = new URL("/lab/personae", req.nextUrl.origin);
  url.searchParams.set("share-target", "1");
  if (text) url.searchParams.set("t", text);
  // A file was shared but couldn't be forwarded (too large for the fallback);
  // the app shows a "open once, then re-share" hint.
  if (hadFile) url.searchParams.set("f", "1");
  return NextResponse.redirect(url, 303);
}

// Returns an HTML page that writes the shared file into the same Cache the app
// reads ("damoa-share"), then redirects in. This makes file sharing work even
// before a service worker is active (it can't read a navigation POST body, but
// this server route can). When a SW *is* active it intercepts the POST first
// and this never runs.
function stashPage(b64: string, type: string, name: string, meta: string) {
  const data = JSON.stringify({ b64, type, name, meta }).replace(
    /</g,
    "\\u003c",
  );
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>공유 처리 중…</title></head><body style="background:#08080a;color:#7d7d76;font-family:monospace;display:grid;place-items:center;height:100vh;margin:0">공유한 내용을 여는 중…<script>
(async () => {
  var go = function(){ location.replace(${JSON.stringify(SHARE_PAGE)}); };
  try {
    var d = ${data};
    var bin = atob(d.b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var cache = await caches.open("damoa-share");
    await cache.put("/__share-file", new Response(new Blob([bytes], { type: d.type }), { headers: { "content-type": d.type, "x-filename": encodeURIComponent(d.name) } }));
    if (d.meta) await cache.put("/__share-meta", new Response(JSON.stringify({ text: d.meta }), { headers: { "content-type": "application/json" } }));
  } catch (e) {}
  go();
})();
</script></body></html>`;
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  let text = "";
  let file: File | null = null;
  try {
    const form = await req.formData();
    text = [form.get("title"), form.get("text"), form.get("url")]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .join("\n")
      .trim();
    const f = form.get("shared");
    if (typeof f !== "string" && f != null && f.size > 0) file = f;
  } catch {
    // no parseable body — still redirect rather than 404
  }

  if (file && file.size <= EMBED_LIMIT) {
    try {
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      return stashPage(
        b64,
        file.type || "application/octet-stream",
        file.name || "shared",
        text,
      );
    } catch {
      // fall through to the redirect
    }
  }
  return redirectInto(req, text, file != null);
}

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const text = [sp.get("title"), sp.get("text"), sp.get("url")]
    .filter((v): v is string => !!v)
    .join("\n")
    .trim();
  return redirectInto(req, text);
}
