import { PhoneNav, PhoneStatusBar } from "./PhoneParts";

const AVATARS = [
  "/img/avatar-1.jpg",
  "/img/avatar-2.jpg",
  "/img/avatar-3.jpg",
  "/img/avatar-4.jpg",
  "/img/avatar-5.jpg",
];

export function PhoneInbox({ title }: { title: string }) {
  return (
    <div className="phone">
      <div className="phone__screen phone__screen--grey">
        <header className="app__plain">
          <PhoneStatusBar />
          <p className="app__screenTitle">{title}</p>
        </header>
        <div className="app__card" aria-hidden="true">
          {AVATARS.map((src) => (
            <div className="convo" key={src}>
              <span className="convo__av">
                <img className="av__photo" src={src} alt="" decoding="async" />
              </span>
              <span className="convo__body">
                <span className="convo__txt">
                  <i />
                  <i />
                </span>
                <span className="convo__time" />
              </span>
            </div>
          ))}
        </div>
        <PhoneNav />
      </div>
    </div>
  );
}
