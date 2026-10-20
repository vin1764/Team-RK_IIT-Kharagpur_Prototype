/** Non-negotiable: on every page, never hidden. Height lives in --concept-strip-h (index.css). */

export function ConceptStrip() {
  return (
    <div
      data-concept-strip
      className="sticky top-0 z-tooltip flex items-center justify-center bg-black text-white/85 text-sm leading-none font-default tracking-wide select-none"
      style={{ height: 'var(--concept-strip-h)' }}
    >
      Concept prototype · Team RK · synthetic data · not affiliated with Meesho
    </div>
  );
}
