import { NextResponse } from "next/server";
import { readGameFile } from "../../_lib/game-files";

type RouteContext = {
  params: Promise<{
    file: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { file } = await params;
  const result = await readGameFile([file]);

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.body, {
    headers: {
      "content-type": result.contentType,
      "cache-control": "no-store",
    },
  });
}
