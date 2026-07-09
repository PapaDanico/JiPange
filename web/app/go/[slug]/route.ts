import { NextResponse } from "next/server";
import { getProductLink } from "@/lib/affiliate-links";

export function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const product = getProductLink(params.slug);
  if (!product) {
    const fallback = new URL(req.url);
    fallback.pathname = "/tools";
    fallback.search = "";
    return NextResponse.redirect(fallback);
  }
  return NextResponse.redirect(product.url);
}
