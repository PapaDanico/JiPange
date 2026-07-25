/**
 * Renders a schema.org object as an inline JSON-LD script tag. The `<`
 * escape prevents a string field that happened to contain "</script>" from
 * breaking out of the tag — defensive even though every caller here only
 * ever passes our own static/config-derived strings, never user input.
 */
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
