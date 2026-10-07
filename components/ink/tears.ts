export type Roughness = "fine" | "medium" | "ragged";

/** Same paths as the CSS tiles, so SVG tears and CSS mask tears match exactly. */
export const TEARS = {
  fine: {
    w: 48,
    h: 12,
    top: "M0 12V4L3 5.5 6 3 9 5 12 2.5 15 4.5 18 3 21 5.5 24 3.5 27 5 30 2.5 33 4.5 36 3 39 5.5 42 3.5 45 5 48 4V12Z",
    bottom: "M0 0V8L3 6.5 6 9 9 7 12 9.5 15 7.5 18 9 21 6.5 24 8.5 27 7 30 9.5 33 7.5 36 9 39 6.5 42 8.5 45 7 48 8V0Z",
  },
  medium: {
    w: 48,
    h: 14,
    top: "M0 14V6L4 9 7 4 11 8 14 3 18 7 21 5 25 9 28 4 32 8 35 3.5 39 7 42 5 46 9 48 6V14Z",
    bottom: "M0 0V8L4 5 7 10 11 6 14 11 18 7 21 9 25 5 28 10 32 6 35 10.5 39 7 42 9 46 5 48 8V0Z",
  },
  ragged: {
    w: 64,
    h: 18,
    top: "M0 18V9L3 12 5 6 10 11 13 4 17 9 19 14 24 8 27 12 31 5 34 10 38 7 41 13 46 6 49 11 53 4.5 57 10 60 7 64 9V18Z",
    bottom: "M0 0V9L3 6 5 12 10 7 13 14 17 9 19 4 24 10 27 6 31 13 34 8 38 11 41 5 46 12 49 7 53 13.5 57 8 60 11 64 9V0Z",
  },
} as const;

export const TEAR_LEFT = {
  w: 12,
  h: 48,
  d: "M12 0H5L7 3 3 6 6 9 4 12 8 15 5 18 7 21 3 24 6 27 4 30 8 33 5 36 7 39 3 42 6 45 5 48H12Z",
} as const;
