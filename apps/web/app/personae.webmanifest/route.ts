// Personae-specific manifest: installing from /lab/personae yields a focused
// "Personae" standalone app that launches straight into the chat maker.
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/lab/personae",
    name: "Personae",
    short_name: "Personae",
    description: "페르소나로 연출하는 가짜 대화 메이커.",
    start_url: "/lab/personae",
    scope: "/lab/personae",
    display: "standalone",
    orientation: "any",
    background_color: "#08080a",
    theme_color: "#08080a",
    // Appear in the OS share sheet. The service worker intercepts this POST,
    // stashes the payload, and redirects into the app to pre-fill the composer.
    share_target: {
      action: "/lab/personae/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "shared",
            accept: [
              "image/*",
              "video/*",
              "audio/*",
              "text/*",
              "application/*",
            ],
          },
        ],
      },
    },
    icons: [
      { src: "/icons/personae.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icons/personae-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/personae-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/personae-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
