import { IconBack, IconChatImage, IconFlag, IconSend } from "./icons";
import { PhoneStatusBar } from "./PhoneParts";

export type ChatBubble = { side: "them" | "me"; text: string };

type Props = {
  name: string;
  bubbles: ChatBubble[];
  field: string;
};

export function PhoneChat({ name, bubbles, field }: Props) {
  return (
    <div className="phone">
      <div className="phone__screen phone__screen--grey">
        <header className="app__top app__top--flat">
          <PhoneStatusBar />
          <div className="chat__head">
            <IconBack />
            <span className="chat__av">
              <img
                className="av__photo"
                src="/img/avatar-2.jpg"
                alt=""
                decoding="async"
              />
            </span>
            <span className="chat__name">{name}</span>
            <IconFlag />
          </div>
        </header>
        <div className="chat">
          {bubbles.map((bubble, i) => (
            <p className={`bubble bubble--${bubble.side}`} key={i}>
              {bubble.text}
            </p>
          ))}
        </div>
        <div className="chat__input" aria-hidden="true">
          <IconChatImage />
          <span className="chat__field">{field}</span>
          <span className="chat__send">
            <IconSend width="1em" height="1em" />
          </span>
        </div>
      </div>
    </div>
  );
}
