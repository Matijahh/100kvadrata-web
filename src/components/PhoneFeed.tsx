import { IconSearch } from "./icons";
import { PhoneNav, PhoneStatusBar } from "./PhoneParts";
import { Reel, type ReelData } from "./Reel";

type Props = {
  reels: ReelData[];
  moreLabel: string;
  search: string;
  tabsLeft: string;
  tabsRight: string;
  /** The hero feed is interactive; gallery copies are static. */
  deck?: boolean;
  deckAria?: string;
};

export function PhoneFeed({
  reels,
  moreLabel,
  search,
  tabsLeft,
  tabsRight,
  deck = false,
  deckAria,
}: Props) {
  return (
    <div className="phone">
      <div className="phone__screen">
        <div
          className="reels"
          data-deck={deck ? "" : undefined}
          tabIndex={deck ? 0 : undefined}
          role={deck ? "group" : undefined}
          aria-label={deck ? deckAria : undefined}
        >
          {reels.map((reel) => (
            <Reel key={reel.user} data={reel} moreLabel={moreLabel} />
          ))}
        </div>

        <header className="app__top">
          <PhoneStatusBar />
          <div className="app__search">
            <span>{search}</span>
            <IconSearch />
          </div>
        </header>

        <div className="app__tabs">
          <span>{tabsLeft}</span>
          <i aria-hidden="true" />
          <b>{tabsRight}</b>
        </div>

        <PhoneNav />
      </div>
    </div>
  );
}
