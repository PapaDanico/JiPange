import { type ProductLink, HAS_AFFILIATE_LINKS } from "@/lib/affiliate-links";

const REGULATOR_COLORS: Record<string, string> = {
  CMA: "bg-[#E9F5EC] text-[#2b4a2b]",
  CBK: "bg-[#EEF2FF] text-[#2b3a7a]",
  SASRA: "bg-[#FFF4DC] text-[#7a4a00]",
  "CBK+CMA": "bg-[#EEF2FF] text-[#2b3a7a]",
};

function ProductCard({ product }: { product: ProductLink }) {
  const regulatorClass = REGULATOR_COLORS[product.regulator] ?? "bg-[#F1ECE3] text-[#4B4238]";
  return (
    <a
      href={`/go/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary leading-tight">{product.shortName}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {product.yieldPct !== undefined && (
            <span className="text-xs text-success font-medium">~{product.yieldPct}% p.a.</span>
          )}
          {product.minKes !== undefined && (
            <span className="text-xs text-[#9A8B80]">from KES {product.minKes.toLocaleString("en-KE")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${regulatorClass}`}>
          {product.regulator}
        </span>
        <span className="text-xs text-primary font-medium">Open →</span>
      </div>
    </a>
  );
}

interface ProductLinksProps {
  products: ProductLink[];
  heading?: string;
}

export default function ProductLinks({ products, heading }: ProductLinksProps) {
  if (!products.length) return null;

  const hasAffiliate = products.some((p) => p.isAffiliate);

  return (
    <div className="space-y-2">
      {heading && (
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{heading}</p>
      )}
      <div className="space-y-2">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      <p className="text-[10px] text-[#9A8B80] leading-relaxed">
        {hasAffiliate || HAS_AFFILIATE_LINKS
          ? "JiPange may earn a small commission if you open an account through these links, at no extra cost to you. We only list CMA- or CBK-regulated products."
          : "Direct links to CMA- or CBK-regulated Kenyan products — no commission currently. Yields are approximate and change weekly."}
      </p>
    </div>
  );
}
