import {
  IconNavChat,
  IconNavHome,
  IconNavPlus,
  IconStatusBar,
} from "./icons";

export function PhoneStatusBar() {
  return (
    <div className="app__status">
      <span>9:41</span>
      <IconStatusBar />
    </div>
  );
}

export function PhoneNav() {
  return (
    <nav className="app__nav" aria-hidden="true">
      <IconNavHome />
      <IconNavPlus />
      <IconNavChat />
      <span className="nav__av">
        <img className="av__photo" src="/img/avatar-me.jpg" alt="" decoding="async" />
      </span>
    </nav>
  );
}
