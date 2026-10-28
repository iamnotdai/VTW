import { useId, type SVGProps } from 'react';

/**
 * Solid icons drawn to match the design board (the menu and speaker glyphs are filled, unlike the
 * outline set from lucide-react). They take `currentColor` and size like lucide icons.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="currentColor"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeSolidIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12.7 2.6a1.1 1.1 0 0 0-1.4 0L2.4 10.1a1.1 1.1 0 0 0 1.4 1.7l.9-.7v8.7c0 .9.7 1.6 1.6 1.6h3.6v-5.6c0-.5.4-.9.9-.9h2.4c.5 0 .9.4.9.9v5.6h3.6c.9 0 1.6-.7 1.6-1.6v-8.7l.9.7a1.1 1.1 0 0 0 1.4-1.7Z"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatSolidIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fillRule="evenodd"
        d="M5.2 3h13.6A3.2 3.2 0 0 1 22 6.2v8.6a3.2 3.2 0 0 1-3.2 3.2h-6.4l-4.6 3.6A.8.8 0 0 1 6.5 21v-3H5.2A3.2 3.2 0 0 1 2 14.8V6.2A3.2 3.2 0 0 1 5.2 3Zm2.6 6.1a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4.2 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4.2 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z"
      />
    </Svg>
  );
}

export function GearSolidIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fillRule="evenodd"
        d="M9.74 4.22 10.26 1.54h3.48l.52 2.68 1.64.68 2.26-1.52 2.46 2.46-1.52 2.26.68 1.64 2.68.52v3.48l-2.68.52-.68 1.64 1.52 2.26-2.46 2.46-2.26-1.52-1.64.68-.52 2.68h-3.48l-.52-2.68-1.64-.68-2.26 1.52-2.46-2.46 1.52-2.26-.68-1.64-2.68-.52v-3.48l2.68-.52.68-1.64-1.52-2.26 2.46-2.46 2.26 1.52ZM12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Speaker with sound waves — the "listen" glyph used on every audio button of the design. */
export function SpeakerSolidIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M11.2 4.3a1 1 0 0 1 1.6.8v13.8a1 1 0 0 1-1.6.8L6.8 16H4a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 4 8h2.8Z"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <path
        d="M15.6 9a4.2 4.2 0 0 1 0 6M18.4 6.4a8 8 0 0 1 0 11.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Speaker that is muted (sound turned off). */
export function SpeakerMutedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M11.2 4.3a1 1 0 0 1 1.6.8v13.8a1 1 0 0 1-1.6.8L6.8 16H4a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 4 8h2.8Z"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <path
        d="m16 9.5 5 5m0-5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** The blue-and-green globe that replaces the "o" of "World" in the wordmark. */
export function GlobeMark(props: IconProps) {
  // Unique ids: several logos can be on the page, some of them hidden.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const sea = `${uid}-sea`;
  const land = `${uid}-land`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" {...props}>
      <defs>
        <radialGradient id={sea} cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#7cc4ff" />
          <stop offset="0.55" stopColor="#2d8cf0" />
          <stop offset="1" stopColor="#1562c8" />
        </radialGradient>
        <linearGradient id={land} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8be04e" />
          <stop offset="1" stopColor="#3faa2c" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill={`url(#${sea})`} />
      <path
        d="M10.5 9.5c3.2-1.4 6.6-.6 7.4 1.6.7 2-1.6 2.6-1 4.5.6 1.7 3.4 1.5 3.6 3.9.2 2.3-2.5 2.7-2.4 5.2.1 2.2-1.4 4.6-3 4-2.6-1-2.3-4.8-4.5-6.6C8.8 20.6 5.2 21 4.4 18.6c-.8-2.7 2.6-7.5 6.1-9.1ZM24.4 7.7c2.8-.6 7.8 1.8 9.3 5.2.8 1.8-.6 2.6-2.1 2.2-1.8-.5-2.9 1-2.3 2.9.6 1.8 2.6 1.8 3 3.8.4 2.4-1.7 5.6-4.2 7.2-1.7 1.1-3.2.2-2.9-1.8.3-2.2 1.8-3.4.9-5.3-.8-1.8-3.4-1.3-4-3.6-.7-2.8 2.3-3.3 2.2-5.8-.1-2.2-.9-4.4.1-4.8Z"
        fill={`url(#${land})`}
      />
      <ellipse cx="14" cy="11.5" rx="5" ry="2.6" fill="#fff" opacity="0.35" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="#0f56b3" strokeOpacity="0.35" />
    </svg>
  );
}
