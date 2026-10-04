// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Real-estate avatars for users without a photo: a skyline, a house, an
// apartment facade or a front door, built from the user's ID.
//
// Everything is derived from the ID, so the same user gets the same avatar on
// every screen and every device with nothing stored or downloaded. Geometry and
// colour come from two separate random streams: switching between light and
// dark mode swaps the palette but leaves the drawing itself untouched.
//
// Shapes are laid out on an 80 × 80 canvas and clipped to a circle by the
// Avatar component, so anything near the corners is decoration that may be cut.

export const AVATAR_CANVAS = 80;

type Paint = {
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
};

export type AvatarShape =
  | ({ kind: "rect"; x: number; y: number; width: number; height: number } & Paint)
  | ({ kind: "circle"; cx: number; cy: number; r: number } & Paint)
  | ({ kind: "polygon"; points: string } & Paint)
  | ({ kind: "path"; d: string } & Paint);

type Random = () => number;
type Palette = readonly string[];
type Generator = (shapeRandom: Random, colorRandom: Random, palette: Palette) => AvatarShape[];

// FNV-1a: a short, stable string hash. Not for security, only for spreading
// IDs evenly over the seeds below.
const hashString = (value: string) => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

// mulberry32: a tiny seeded generator, so the sequence is the same everywhere.
const seededRandom = (seed: number): Random => {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T>(random: Random, items: readonly T[]) =>
  items[Math.floor(random() * items.length)];

const shuffled = <T>(random: Random, items: readonly T[]) => {
  const result = items.slice();

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

const luminance = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * A background colour and the palette colours that stand out against it, so a
 * building never disappears into its own sky. Falls back to the two furthest
 * colours when nothing clears the bar, which only happens with a flat palette.
 */
const pickColors = (random: Random, palette: Palette) => {
  const background = pick(random, palette);
  const backgroundLuminance = luminance(background);
  let foregrounds = palette.filter(
    (color) => Math.abs(luminance(color) - backgroundLuminance) >= 0.3,
  );

  if (foregrounds.length < 2) {
    foregrounds = palette
      .filter((color) => color !== background)
      .sort(
        (first, second) =>
          Math.abs(luminance(second) - backgroundLuminance) -
          Math.abs(luminance(first) - backgroundLuminance),
      )
      .slice(0, 2);
  }

  const [primary, secondary = primary] = shuffled(random, foregrounds);

  return { background, primary, secondary };
};

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  opacity?: number,
): AvatarShape => ({ kind: "rect", x, y, width, height, fill, opacity });

const skyline: Generator = (random, colorRandom, palette) => {
  const { background, primary, secondary } = pickColors(colorRandom, palette);
  const shapes: AvatarShape[] = [rect(0, 0, AVATAR_CANVAS, AVATAR_CANVAS, background)];

  if (random() > 0.4) {
    shapes.push({ kind: "circle", cx: random() > 0.5 ? 24 : 56, cy: 22, r: 7, fill: secondary });
  }

  const ground = 64;
  let x = 6 + Math.round(random() * 6);
  let index = 0;

  while (x < 70) {
    const width = 12 + Math.round(random() * 9);
    const height = 16 + Math.round(random() * 28);
    const color = index % 2 ? secondary : primary;
    const top = ground - height;

    shapes.push(rect(x, top, width, height, color));

    const roof = random();

    if (roof < 0.25) {
      shapes.push({
        kind: "polygon",
        points: `${x},${top} ${x + width / 2},${top - 8} ${x + width},${top}`,
        fill: color,
      });
    } else if (roof < 0.4) {
      shapes.push(rect(x + width / 2 - 1, top - 7, 2, 7, color));
    }

    for (let windowY = top + 4; windowY < ground - 4; windowY += 6) {
      for (let windowX = x + 3; windowX < x + width - 4; windowX += 5) {
        if (random() > 0.4) {
          shapes.push(rect(windowX, windowY, 2.5, 3, background));
        }
      }
    }

    x += width + (random() > 0.6 ? 2 : 0);
    index += 1;
  }

  shapes.push(rect(0, ground, AVATAR_CANVAS, 16, primary));

  return shapes;
};

const house: Generator = (random, colorRandom, palette) => {
  const { background, primary: body, secondary: roof } = pickColors(colorRandom, palette);
  const shapes: AvatarShape[] = [rect(0, 0, AVATAR_CANVAS, AVATAR_CANVAS, background)];
  const width = 34 + Math.round(random() * 10);
  const x = 40 - width / 2;
  const top = 40 + Math.round(random() * 6);
  const bottom = 66;
  const roofType = random();

  // Only a pitched roof gets a chimney; drawn first so the roof overlaps it.
  if (roofType < 0.45 && random() > 0.4) {
    shapes.push(rect(x + width - 13, top - 17, 5, 12, roof));
  }

  if (roofType < 0.45) {
    shapes.push({
      kind: "polygon",
      points: `${x - 4},${top} 40,${top - 19} ${x + width + 4},${top}`,
      fill: roof,
    });
  } else if (roofType < 0.8) {
    shapes.push({
      kind: "polygon",
      points: `${x - 3},${top} ${x + 9},${top - 13} ${x + width - 9},${top - 13} ${x + width + 3},${top}`,
      fill: roof,
    });
  } else {
    shapes.push(rect(x - 3, top - 5, width + 6, 5, roof));
  }

  shapes.push(rect(x, top, width, bottom - top, body));

  const doorOnLeft = random() > 0.5;
  shapes.push(rect(doorOnLeft ? x + 5 : x + width - 14, bottom - 15, 9, 15, roof));

  const windowX = doorOnLeft ? x + width - 13 : x + 5;
  shapes.push(rect(windowX, top + 6, 8, 8, background));

  if (width > 40) {
    shapes.push(rect(doorOnLeft ? windowX - 11 : windowX + 11, top + 6, 8, 8, background));
  }

  shapes.push(rect(0, bottom, AVATAR_CANVAS, 14, roof));

  return shapes;
};

const facade: Generator = (random, colorRandom, palette) => {
  const { background, primary: lit } = pickColors(colorRandom, palette);
  const shapes: AvatarShape[] = [
    rect(0, 0, AVATAR_CANVAS, AVATAR_CANVAS, background),
    rect(0, 9, AVATAR_CANVAS, 3, lit, 0.5),
  ];

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const isLit = random() > 0.5;
      shapes.push(rect(16 + column * 13, 16 + row * 12, 9, 8, lit, isLit ? undefined : 0.22));
    }
  }

  return shapes;
};

const frontDoor: Generator = (random, colorRandom, palette) => {
  const { background, primary: door, secondary: frame } = pickColors(colorRandom, palette);
  const shapes: AvatarShape[] = [rect(0, 0, AVATAR_CANVAS, AVATAR_CANVAS, background)];
  const x = 25;
  const width = 30;
  const top = 18;
  const bottom = 72;
  const isArched = random() > 0.5;
  const knobOnLeft = random() > 0.5;
  const hasFourPanels = random() > 0.5;

  if (isArched) {
    const archBase = top + width / 2;
    const archPath = (inset: number) =>
      `M${x - inset} ${bottom}V${archBase}A${width / 2 + inset} ${width / 2 + inset} 0 0 1 ${x + width + inset} ${archBase}V${bottom}Z`;

    shapes.push({ kind: "path", d: archPath(3), fill: frame });
    shapes.push({ kind: "path", d: archPath(0), fill: door });
    shapes.push({
      kind: "path",
      d: `M${x + 3} ${archBase}A${width / 2 - 3} ${width / 2 - 3} 0 0 1 ${x + width - 3} ${archBase}Z`,
      fill: background,
      opacity: 0.7,
    });
  } else {
    shapes.push(rect(x - 3, top - 3, width + 6, bottom - top + 3, frame));
    shapes.push(rect(x, top, width, bottom - top, door));
    shapes.push(rect(x + 3, top + 3, width - 6, 7, background, 0.7));
  }

  const panelTop = isArched ? top + width / 2 + 4 : top + 14;
  const panelsHeight = bottom - panelTop - 6;
  const panel = (panelX: number, panelY: number, panelWidth: number, panelHeight: number): AvatarShape => ({
    kind: "rect",
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    fill: "none",
    stroke: background,
    strokeOpacity: 0.45,
    strokeWidth: 1.5,
  });

  if (hasFourPanels) {
    const panelWidth = (width - 12) / 2;
    const panelHeight = (panelsHeight - 3) / 2;

    shapes.push(
      panel(x + 4, panelTop, panelWidth, panelHeight),
      panel(x + 8 + panelWidth, panelTop, panelWidth, panelHeight),
      panel(x + 4, panelTop + panelHeight + 3, panelWidth, panelHeight),
      panel(x + 8 + panelWidth, panelTop + panelHeight + 3, panelWidth, panelHeight),
    );
  } else {
    shapes.push(panel(x + 5, panelTop, width - 10, panelsHeight));
  }

  shapes.push({ kind: "circle", cx: knobOnLeft ? x + 6 : x + width - 6, cy: bottom - 22, r: 2, fill: frame });
  shapes.push(rect(x - 7, bottom, width + 14, 8, frame));

  return shapes;
};

const GENERATORS: Generator[] = [skyline, house, facade, frontDoor];

export const generateAvatarShapes = (userId: string, palette: Palette) => {
  const generator = GENERATORS[hashString(`${userId}:style`) % GENERATORS.length];

  return generator(
    seededRandom(hashString(userId)),
    seededRandom(hashString(`${userId}:colors`)),
    palette,
  );
};
