import { NextResponse } from "next/server";
import { getProductLink } from "@/lib/affiliate-links";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = getProductLink(slug);
  if (!product) {
    const fallback = new URL(req.url);
    fallback.pathname = "/tools";
    fallback.search = "";
    return NextResponse.redirect(fallback);
  }
  return NextResponse.redirect(product.url);
}
