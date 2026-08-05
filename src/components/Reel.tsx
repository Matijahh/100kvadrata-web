import { IconBookmark, IconComment, IconHeart, IconPin, IconSend } from "./icons";

export type ReelData = {
  photo: string;
  avatar: string;
  price: { amount: string; area: string };
  likes: string;
  user: string;
  loc: string;
  desc: string;
  /** Which of the three carousel dots is active (0–2). */
  active: number;
  /** Lazy-load the room photo (the first hero reel loads eagerly). */
  lazy?: boolean;
};

export function Reel({
  data,
  moreLabel,
}: {
  data: ReelData;
  moreLabel: string;
}) {
  return (
    <article className="reel">
      <span className="reel__art">
        <img
          className="art__photo"
          src={data.photo}
          alt=""
          decoding="async"
          loading={data.lazy ? "lazy" : undefined}
        />
        <span className="art__lamp" />
        <span className="art__window" />
        <span className="art__floor" />
      </span>

      <p className="reel__price">
        <b>{data.price.amount}</b> <s>/</s> {data.price.area}
      </p>

      <div className="reel__rail">
        <span className="rail__av">
          <img className="av__photo" src={data.avatar} alt="" decoding="async" />
        </span>
        <span className="rail__btn">
          <IconHeart />
          <i>{data.likes}</i>
        </span>
        <span className="rail__btn">
          <IconBookmark />
        </span>
        <span className="rail__btn">
          <IconComment />
        </span>
        <span className="rail__btn">
          <IconSend />
        </span>
      </div>

      <div className="reel__meta">
        <p className="meta__user">{data.user}</p>
        <p className="meta__loc">
          <IconPin />
          {data.loc}
        </p>
        <p className="meta__desc">{data.desc}</p>
        <p className="meta__more">{moreLabel}</p>
      </div>

      <div className="reel__dots" aria-hidden="true">
        <i className={data.active === 0 ? "on" : undefined} />
        <i className={data.active === 1 ? "on" : undefined} />
        <i className={data.active === 2 ? "on" : undefined} />
      </div>
    </article>
  );
}
