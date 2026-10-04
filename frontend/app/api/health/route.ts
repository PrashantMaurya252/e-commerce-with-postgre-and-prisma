export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      release: process.env.RELEASE_SHA,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}