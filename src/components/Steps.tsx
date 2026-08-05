import { ArrowDart } from "./icons";

export type StepsContent = {
  head: { eyebrow: string; h2: string; lede: string };
  steps: { h3: string; body: string }[];
};

type Props = StepsContent & {
  /** Path drawn by the flying arrow (bows left or right). */
  arc: string;
  /** Deep background band + head reordered to the right on desktop. */
  flip?: boolean;
};

function Track({ arc, steps }: { arc: string; steps: Props["steps"] }) {
  return (
    <div className="track">
      <svg
        className="track__arc"
        viewBox="0 0 44 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={arc} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="track__arrow" aria-hidden="true">
        <ArrowDart />
      </span>

      {steps.map((step) => (
        <div className="step" key={step.h3}>
          <h3>{step.h3}</h3>
          <p>{step.body}</p>
        </div>
      ))}
    </div>
  );
}

function Head({ head }: { head: Props["head"] }) {
  return (
    <div className="steps__head reveal">
      <p className="eyebrow">{head.eyebrow}</p>
      <h2>{head.h2}</h2>
      <p className="lede">{head.lede}</p>
    </div>
  );
}

export function Steps({ head, steps, arc, flip = false }: Props) {
  return (
    <section className={flip ? "band band--deep" : "band"}>
      <div className={flip ? "wrap steps steps--flip" : "wrap steps"}>
        {flip ? (
          <>
            <Track arc={arc} steps={steps} />
            <Head head={head} />
          </>
        ) : (
          <>
            <Head head={head} />
            <Track arc={arc} steps={steps} />
          </>
        )}
      </div>
    </section>
  );
}
