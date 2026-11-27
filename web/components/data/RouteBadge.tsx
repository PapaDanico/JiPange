import { tbillRoute } from "@/lib/rates-feed";

/**
 * How the publisher says the T-bill figures arrived, as a word beside the
 * provenance line. Renders nothing when the route is unknown. Word plus tint,
 * never colour alone: a figure not read from the primary document uses the
 * accent tint (accent-ink on accent-soft, 5.60:1) so it stands out; the rest
 * use the quiet muted text (6.08:1 on background).
 */
export default function RouteBadge() {
  const route = tbillRoute();
  if (!route) return null;
  return (
    <span
      title={route.detail}
      className={
        route.primary
          ? "whitespace-nowrap rounded border border-canvas px-1.5 py-0.5 text-[0.7rem] font-semibold text-muted"
          : "whitespace-nowrap rounded bg-accent-soft px-1.5 py-0.5 text-[0.7rem] font-semibold text-accent-ink"
      }
    >
      Source route: {route.label}
    </span>
  );
}
