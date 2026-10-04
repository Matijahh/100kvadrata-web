"use client";

import { cn } from "@/lib/cn";
import { darkColors, lightColors } from "@/theme/palette";
import {
  AVATAR_CANVAS,
  AvatarShape,
  generateAvatarShapes,
} from "@/utils/generatedAvatar";
import { memo, useMemo } from "react";

// Web counterpart of flatswipe/src/components/genericComponents/Avatar.tsx: the
// user's photo, or the same generated real-estate avatar the app draws for
// them (generatedAvatar.ts is shared), so a person looks identical everywhere.
//
// The generator picks colours by luminance, so the dark-theme avatar is a
// different drawing, not a recolour. Both are rendered and CSS shows the one
// for the active theme — no hydration mismatch, no flash on theme change.

type AvatarProps = {
  /** Seeds the generated avatar. Without it there is nothing to draw yet. */
  userId: string | null | undefined;
  avatarUrl?: string | null;
  /** Diameter in px. Leave it out to fill a parent that sets the size. */
  size?: number;
  className?: string;
  alt?: string;
};

export default function Avatar({ userId, avatarUrl, size, className, alt = "" }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-surface-muted",
        size == null && "h-full w-full",
        className,
      )}
      style={size != null ? { width: size, height: size } : undefined}
    >
      {avatarUrl ? (
        // Plain <img>: avatars are tiny and already resized to 512px on upload.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : userId ? (
        <>
          <GeneratedAvatar
            userId={userId}
            palette={lightColors.avatarPalette}
            className="dark:hidden"
          />
          <GeneratedAvatar
            userId={userId}
            palette={darkColors.avatarPalette}
            className="hidden dark:block"
          />
        </>
      ) : null}
    </span>
  );
}

const GeneratedAvatar = memo(function GeneratedAvatar({
  userId,
  palette,
  className,
}: {
  userId: string;
  palette: readonly string[];
  className?: string;
}) {
  const shapes = useMemo(() => generateAvatarShapes(userId, palette), [userId, palette]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${AVATAR_CANVAS} ${AVATAR_CANVAS}`}
      className={className}
      aria-hidden
    >
      {shapes.map(renderShape)}
    </svg>
  );
});

const renderShape = (shape: AvatarShape, index: number) => {
  switch (shape.kind) {
    case "rect": {
      const { kind: _kind, ...props } = shape;
      return <rect key={index} {...props} />;
    }
    case "circle": {
      const { kind: _kind, ...props } = shape;
      return <circle key={index} {...props} />;
    }
    case "polygon": {
      const { kind: _kind, ...props } = shape;
      return <polygon key={index} {...props} />;
    }
    case "path": {
      const { kind: _kind, ...props } = shape;
      return <path key={index} {...props} />;
    }
  }
};
