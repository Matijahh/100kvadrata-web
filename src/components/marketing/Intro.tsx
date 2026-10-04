import { SwooshPaths, TypePaths } from "./Logo";

// The one-time brand curtain. It's hidden until the `.js` class lands on
// <html>, plays via SiteEffects, and removes itself — so it can never trap
// content and is skipped entirely for reduced motion.
export function Intro() {
  return (
    <div id="intro" aria-hidden="true">
      <svg
        className="intro__logo"
        viewBox="0 0 186 106"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="intro__swoosh">
          <SwooshPaths />
        </g>
        <g className="intro__type">
          <TypePaths />
        </g>
      </svg>
    </div>
  );
}
