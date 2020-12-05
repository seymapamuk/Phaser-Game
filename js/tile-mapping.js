// Our custom tile mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
const TILE_MAPPING = {
  BLANK: 168,
  WALL: {
    TOP_LEFT: 115,
    TOP_RIGHT: 117,
    BOTTOM_RIGHT: 149,
    BOTTOM_LEFT: 147,
    TOP: 116,
    LEFT: 131,
    RIGHT: 133,
    BOTTOM: 148
  },
  FLOOR: 70,
  DOOR: {
    TOP: [117, 70, 115],
    // prettier-ignore
    LEFT: [
      [147], 
      [70], 
      [115]
    ],
    BOTTOM: [149, 70, 147],
    // prettier-ignore
    RIGHT: [
      [149], 
      [70], 
      [117]
    ]
  },
  CHEST: [
    [179],
    [195]
    ],
  FINISH: 138,
  // prettier-ignore
  BOOKCASE: [
    [82],
    [98]
  ],
  SACKS: 83,
};

export default TILE_MAPPING