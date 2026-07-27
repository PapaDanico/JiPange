import { NextResponse } from "next/server";
import { getProductLink } from "@/lib/affiliate-links";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = getProductLink(slug);
  // A product with no verified URL is as much a dead end here as an unknown
  // slug — `redirect(undefined)` would throw, and inventing a destination is
  // the exact thing the missing URL is protecting against. Both land back on
  // the directory, which is where the reader can see the fund's real details.
  if (!product?.url) {
    const fallback = new URL(req.url);
    fallback.pathname = product ? "/partners" : "/tools";
    fallback.search = "";
    return NextResponse.redirect(fallback);
  }
  return NextResponse.redirect(product.url);
}
