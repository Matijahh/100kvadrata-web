/* Inline SVG icons, ported 1:1 from the original static site. They use
   `currentColor` and em-based sizing, so styling stays in globals.css. */

type IconProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

export function IconClock({ className, width = 15, height = 15 }: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 4.6V8l2.2 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconArrow({
  className = "cta__arrow",
  width = 16,
  height = 16,
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHeart({
  className,
  width = "1.6em",
  height = "1.6em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 37 33"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18.3333 7.61609C14.6667 -0.990377 1.83333 -0.07371 1.83333 10.9263C1.83333 21.9264 18.3333 31.0934 18.3333 31.0934C18.3333 31.0934 34.8333 21.9264 34.8333 10.9263C34.8333 -0.07371 22 -0.990377 18.3333 7.61609Z"
        stroke="currentColor"
        strokeWidth="3.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBookmark({
  className,
  width = "1.7em",
  height = "1.7em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 7.2002V16.6854C6 18.0464 6 18.7268 6.20412 19.1433C6.58245 19.9151 7.41157 20.3588 8.26367 20.2454C8.7234 20.1842 9.28964 19.8067 10.4221 19.0518L10.4248 19.0499C10.8737 18.7507 11.0981 18.6011 11.333 18.5181C11.7642 18.3656 12.2348 18.3656 12.666 18.5181C12.9013 18.6012 13.1266 18.7515 13.5773 19.0519C14.7098 19.8069 15.2767 20.1841 15.7364 20.2452C16.5885 20.3586 17.4176 19.9151 17.7959 19.1433C18 18.7269 18 18.0462 18 16.6854V7.19691C18 6.07899 18 5.5192 17.7822 5.0918C17.5905 4.71547 17.2837 4.40973 16.9074 4.21799C16.4796 4 15.9203 4 14.8002 4H9.2002C8.08009 4 7.51962 4 7.0918 4.21799C6.71547 4.40973 6.40973 4.71547 6.21799 5.0918C6 5.51962 6 6.08009 6 7.2002Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconComment({
  className,
  width = "1.5em",
  height = "1.5em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 33 33"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.82129 28.6251C10.9504 29.853 13.4206 30.5555 16.055 30.5555C24.0631 30.5555 30.5556 24.0637 30.5556 16.0556C30.5556 8.04743 24.0637 1.55554 16.0556 1.55554C8.04743 1.55554 1.55556 8.04743 1.55556 16.0556C1.55556 18.6899 2.25807 21.1602 3.48598 23.2893L3.49073 23.2975C3.60888 23.5024 3.66846 23.6057 3.69545 23.7033C3.7209 23.7954 3.72801 23.8782 3.72149 23.9735C3.71449 24.0759 3.67997 24.1821 3.60921 24.3944L2.37055 28.1104L2.36899 28.1152C2.10765 28.8993 1.97698 29.2913 2.07012 29.5525C2.15133 29.7802 2.33161 29.96 2.55936 30.0412C2.81998 30.1342 3.21024 30.0041 3.99083 29.7439L4.00054 29.7403L7.71652 28.5016C7.9281 28.4311 8.03567 28.3953 8.1379 28.3883C8.23321 28.3818 8.31542 28.3904 8.4075 28.4159C8.50538 28.4429 8.60874 28.5025 8.81464 28.6213L8.82129 28.6251Z"
        stroke="currentColor"
        strokeWidth="3.11111"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSend({
  className,
  width = "1.7em",
  height = "1.7em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.3078 13.6923L15.1539 8.84619M20.1113 5.88867L16.0207 19.1833C15.6541 20.3747 15.4706 20.9707 15.1544 21.1683C14.8802 21.3396 14.5406 21.3683 14.2419 21.2443C13.8975 21.1014 13.618 20.5433 13.0603 19.428L10.4694 14.2461C10.3809 14.0691 10.3366 13.981 10.2775 13.9043C10.225 13.8363 10.1645 13.7749 10.0965 13.7225C10.0215 13.6647 9.93486 13.6214 9.76577 13.5369L4.57192 10.9399C3.45662 10.3823 2.89892 10.1032 2.75601 9.75879C2.63207 9.4601 2.66033 9.12023 2.83169 8.84597C3.02928 8.52974 3.62523 8.34603 4.81704 7.97932L18.1116 3.88867C19.0486 3.60038 19.5173 3.45635 19.8337 3.57253C20.1094 3.67373 20.3267 3.89084 20.4279 4.16651C20.544 4.48283 20.3999 4.95126 20.1119 5.88729L20.1113 5.88867Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPin({
  className,
  width = "0.85em",
  height = "0.85em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 11 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0.642868 5.09325C0.642868 8.2123 3.37147 10.7916 4.57923 11.7805C4.75208 11.922 4.83954 11.9937 4.96849 12.03C5.06891 12.0582 5.21669 12.0582 5.31711 12.03C5.4463 11.9936 5.53315 11.9227 5.70665 11.7806C6.9144 10.7917 9.64287 8.21258 9.64287 5.09354C9.64287 3.91317 9.16879 2.78101 8.32487 1.94637C7.48095 1.11172 6.33643 0.642822 5.14295 0.642822C3.94946 0.642822 2.80481 1.11179 1.9609 1.94644C1.11698 2.78108 0.642868 3.91289 0.642868 5.09325Z"
        stroke="currentColor"
        strokeWidth="1.28572"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.85717 4.49999C3.85717 5.21007 4.43281 5.78571 5.14289 5.78571C5.85298 5.78571 6.42862 5.21007 6.42862 4.49999C6.42862 3.7899 5.85298 3.21427 5.14289 3.21427C4.43281 3.21427 3.85717 3.7899 3.85717 4.49999Z"
        stroke="currentColor"
        strokeWidth="1.28572"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconStatusBar({
  className,
  width = "2.6em",
  height = "0.72em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 46 12"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="0" y="7" width="3" height="5" rx="1" />
      <rect x="5" y="5" width="3" height="7" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="1" width="3" height="11" rx="1" />
      <path d="M22 4.2a7.5 7.5 0 0 1 9 0l-1.1 1.4a5.7 5.7 0 0 0-6.8 0z" />
      <path d="M24.4 7.1a4 4 0 0 1 4.2 0l-2.1 2.6z" />
      <rect x="34" y="2" width="10" height="8" rx="2.2" opacity=".4" />
      <rect x="35.2" y="3.2" width="7.6" height="5.6" rx="1.4" />
      <rect x="45" y="4.6" width="1" height="2.8" rx=".5" opacity=".4" />
    </svg>
  );
}

export function IconSearch({
  className,
  width = "1.15em",
  height = "1.15em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 15L21 21M10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavHome({
  className,
  width = "1.5em",
  height = "1.5em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 20H4M4 20H9M4 20V7.2002C4 6.08009 4 5.51962 4.21799 5.0918C4.40973 4.71547 4.71547 4.40973 5.0918 4.21799C5.51962 4 6.08009 4 7.2002 4H8.8002C9.9203 4 10.4796 4 10.9074 4.21799C11.2837 4.40973 11.5905 4.71547 11.7822 5.0918C12 5.5192 12 6.07899 12 7.19691V10.0002M9 20H20M9 20V14.3682C9 13.8428 9 13.58 9.063 13.335C9.11883 13.1178 9.21073 12.9118 9.33496 12.7252C9.47505 12.5147 9.67113 12.3384 10.0615 11.9877L12.3631 9.91997C13.1178 9.24192 13.4955 8.90264 13.9225 8.77393C14.2989 8.66045 14.7007 8.66045 15.0771 8.77393C15.5045 8.90275 15.8827 9.2422 16.6387 9.92139L18.9387 11.9877C19.3295 12.3388 19.5245 12.5146 19.6647 12.7252C19.7889 12.9118 19.8807 13.1178 19.9365 13.335C19.9995 13.58 20 13.8428 20 14.3682V20M20 20H22"
        stroke="currentColor"
        strokeWidth="2.38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavPlus({
  className,
  width = "1.5em",
  height = "1.5em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 12H12M12 12H16M12 12V16M12 12V8M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2.38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavChat({
  className,
  width = "1.5em",
  height = "1.5em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.2306 21.6514C17.4915 21.3592 21.6673 17.001 21.6673 11.667C21.6673 6.14404 17.19 1.66675 11.667 1.66675C6.144 1.66675 1.66672 6.14404 1.66672 11.667C1.66672 13.635 2.23496 15.47 3.21658 17.0171L2.50984 19.1374L2.50872 19.1405C2.23803 19.9525 2.10262 20.3587 2.19904 20.6291C2.28306 20.8647 2.46955 21.0505 2.70516 21.1345C2.97463 21.2306 3.37801 21.0961 4.18461 20.8272L4.19609 20.8237L6.31692 20.117C7.86407 21.0986 9.69921 21.667 11.6671 21.667C11.8562 21.667 12.0441 21.6618 12.2306 21.6514ZM12.2306 21.6514C13.5989 25.544 17.3073 28.3345 21.6676 28.3345C23.6355 28.3345 25.4702 27.7656 27.0172 26.7839L29.1376 27.4906L29.1417 27.4914C29.9537 27.7621 30.3606 27.8977 30.631 27.8013C30.8666 27.7173 31.0507 27.5316 31.1347 27.296C31.2313 27.0252 31.0963 26.6185 30.8248 25.8043L30.1181 23.684L30.3548 23.2917C31.1906 21.8306 31.6667 20.1378 31.6667 18.3339C31.6667 12.8109 27.1903 8.33362 21.6673 8.33362L21.293 8.34051L21.1042 8.34974"
        stroke="currentColor"
        strokeWidth="3.33343"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBack({
  className,
  width = "1.25em",
  height = "1.25em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFlag({
  className = "flag",
  width = "1.15em",
  height = "1.15em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V3.5C20 3.5 19 4.5 16 4.5C13 4.5 11 2.5 8 2.5C5 2.5 4 3.5 4 3.5V15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 21V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChatImage({
  className,
  width = "1.15em",
  height = "1.15em",
}: IconProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.00005 17.0001C3 16.9355 3 16.8689 3 16.8002V7.2002C3 6.08009 3 5.51962 3.21799 5.0918C3.40973 4.71547 3.71547 4.40973 4.0918 4.21799C4.51962 4 5.08009 4 6.2002 4H17.8002C18.9203 4 19.4801 4 19.9079 4.21799C20.2842 4.40973 20.5905 4.71547 20.7822 5.0918C21 5.5192 21 6.07899 21 7.19691V16.8031C21 17.2881 21 17.6679 20.9822 17.9774M3.00005 17.0001C3.00082 17.9884 3.01337 18.5058 3.21799 18.9074C3.40973 19.2837 3.71547 19.5905 4.0918 19.7822C4.5192 20 5.07899 20 6.19691 20H17.8036C18.9215 20 19.4805 20 19.9079 19.7822C20.2842 19.5905 20.5905 19.2837 20.7822 18.9074C20.9055 18.6654 20.959 18.3813 20.9822 17.9774M3.00005 17.0001L7.76798 11.4375L7.76939 11.436C8.19227 10.9426 8.40406 10.6955 8.65527 10.6064C8.87594 10.5282 9.11686 10.53 9.33643 10.6113C9.58664 10.704 9.79506 10.9539 10.2119 11.4541L12.8831 14.6595C13.269 15.1226 13.463 15.3554 13.6986 15.4489C13.9065 15.5313 14.1357 15.5406 14.3501 15.4773C14.5942 15.4053 14.8091 15.1904 15.2388 14.7607L15.7358 14.2637C16.1733 13.8262 16.3921 13.6076 16.6397 13.5361C16.8571 13.4734 17.0896 13.4869 17.2988 13.5732C17.537 13.6716 17.7302 13.9124 18.1167 14.3955L20.9822 17.9774M20.9822 17.9774L21 17.9996M15 10C14.4477 10 14 9.55228 14 9C14 8.44772 14.4477 8 15 8C15.5523 8 16 8.44772 16 9C16 9.55228 15.5523 10 15 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The dart that flies down the steps. Sized to 100% by .track__arrow svg,
// so it carries no width/height of its own.
export function ArrowDart({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.3345 15.9657C19.6455 16.3771 19.4924 16.9712 19.0212 17.1809L1.32682 25.0554C0.714477 25.328 0.0583164 24.7731 0.22566 24.1241L6.23922 0.800904C6.40653 0.152009 7.24936 -0.0170941 7.65369 0.51714L19.3345 15.9657Z"
        fill="#DB492B"
        stroke="#DB492B"
        strokeWidth="0.398042"
      />
    </svg>
  );
}
