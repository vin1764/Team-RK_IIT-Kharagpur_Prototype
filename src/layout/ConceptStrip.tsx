/** Non-negotiable: on every page, never hidden. */
export const CONCEPT_STRIP_HEIGHT = 20;

export function ConceptStrip() {
  return (
    <div
      data-concept-strip
      className="sticky top-0 z-tooltip flex items-center justify-center bg-black text-white/85 text-sm leading-none font-default tracking-wide select-none"
      style={{ height: CONCEPT_STRIP_HEIGHT }}
    >
      Concept prototype · Team RK · synthetic data · not affiliated with Meesho
    </div>
  );
}
