import { ELVL } from './ELVLUtils';

export interface ELVLChunk {
  id: string;
  equals(next: ELVLChunk): boolean;
  // TODO(JabJabJab): If this is only going to be called from each object's constructor, consider omitting it from the interface.
  validate(): void;
}

export interface class ELVLRegionChunk {
  id: string;
}

export class ELVLCollection {

  readonly chunks: ELVLChunk[] = [];
  readonly regions: ELVLRegion[] = [];
  readonly attributes: ELVLAttribute[] = [];

  addChunk(chunk: ELVLChunk): void {
    if (this.hasChunk(chunk)) {
      throw new Error('The ELVLChunk is already in the collection.');
    }
    this.chunks.push(chunk);
  }

  addRegion(region: ELVLRegion): void {
    if (this.hasRegion(region)) {
      throw new Error('The ELVLRegion is already in the collection.');
    }
    this.regions.push(region);
  }

  hasChunk(want: ELVLChunk): boolean {
    return this.chunks.some(have => want.equals(have));
  }

  hasAttribute(want: ELVLAttribute): boolean {
    return this.attributes.some(have => want.equals(have));
  }

  hasRegion(want: ELVLRegion): boolean {
    return this.regions.some(have => want.equals(have));
  }

  addAttribute(attribute: ELVLAttribute): void {
    if (this.hasAttribute(attribute)) {
      throw new Error('The ELVLAttribute is already in the collection.');
    }
    this.attributes.push(attribute);
  }
  
  // TODO(JabJabJab): You can just access the public variables; TS doesn't encourage privacy and getters like Java does.
  // If you ever need to, you can still override the getter on the proprety later, e.g.:
  // get attributes() {
  //   return someComplexWork();
  // }
  // I'm leaving them here in case there are references.

  getAttributes(): ELVLAttribute[] {
    return this.attributes;
  }

  getRegions(): ELVLRegion[] {
    return this.regions;
  }

  getChunks(): ELVLChunk[] {
    return this.chunks;
  }
}

// TODO(JabJabJab): Consider making this abstract.
// Also, it'd be good to move it down to where all its implementations are.
export class ELVLRawChunk implements ELVLChunk {
  constructor(readonly id: string, readonly data: Buffer) {}

  /** @override */
  equals(next: ELVLChunk): boolean {
    return (next instanceof ELVLRawChunk) && next === this;
  }

  /** @override */
  validate(): void {}
}

export class ELVLAttribute implements ELVLChunk {
  readonly id = 'ATTR';

  constructor(readonly name: string, readonly value: string) {
    this.validate();
  }

  /** @override */
  equals(next: ELVLChunk): boolean {
    return next instanceof ELVLAttribute && next.id == this.id && next.name == this.name && next.value == this.value;
  }

  /** @override */
  validate(): void {}
}

export class ELVLRegion implements ELVLChunk {
  readonly id = 'REGN';

  color: number[] = [0, 0, 0];

  constructor(
    readonly name: string,
    // TODO(JabJabJab): If you actually want a mutable copy, add a helper function for it.  Assigning null here means 'options' has type ELVLRegionOptions|null.
    readonly options: ELVLRegionOptions = ELVL.DEFAULT_REGION_OPTIONS,
    readonly tileData: ELVLRegionTileData = new ELVLRegionTileData(),
    readonly autoWarp: ELVLRegionAutoWarp|null = null,
    readonly pythonCode: string|null = null,
    readonly chunks: ELVLRegionChunk[] = []
  ) {
    this.validate();
  }

  /** @override */
  equals(next: ELVLRegion): boolean {
    return next.id === this.id && next.name === this.name;
  }

  /** @override */
  validate(): void {
    if (this.autoWarp != null) {
      this.autoWarp.validate();
    }
    this.tileData.validate();
  }
}

export class ELVLRegionRawChunk implements ELVLRegionChunk {

  constructor(readonly id: string, readonly data: Buffer) {}

  // TODO(JabJabJab): This is not currently not overriding anything!
  /** @override */
  equals(other: any): boolean {
    return other === this;
  }
}

export class ELVLRegionTileData implements ELVLRegionChunk {
  readonly id = 'rTIL';
  readonly tiles: boolean[][];

  constructor(readonly tiles: boolean[][] = ELVLRegionTileData.blankTileData()) {
    this.validate();
  }
  
  private static blankTileData(): boolean[][] {
      // Create a new blank array.
      const tiles = new Array(1024);
      for (let x = 0; x < 1024; x++) {
        tiles[x] = new Array(1024);
        tiles[x].fill(false);
      }
    return tiles;
  }
    

  // TODO(JabJabJab): This is not currently not overriding anything!
  /** @override */
  validate(): void {
    // TODO: Implement.
  }
}

export class ELVLRegionAutoWarp implements ELVLRegionChunk {
  readonly id = 'rAWP';

  /**
   * @constructor
   *
   * @param {number} x The 'x' coordinate to warp a player. If set to -1, this will be the player's current 'x'
   *   coordinate. If set to 0, the 'x' coordinate will be the player's spawn 'x' coordinate. If set to 1-1023, this
   *   will be the coordinate to warp to.
   *
   *  @param {number} y The 'y' coordinate to warp a player. If set to -1, this will be the player's current 'y'
   *   coordinate. If set to 0, the 'y' coordinate will be the player's spawn 'y' coordinate. If set to 1-1023, this
   *   will be the coordinate to warp to.
   *
   * @param {string} arena The arena name to warp to. Set to null not warp to a different arena.
   */
  constructor(readonly x: number, readonly y: number, readonly arena: string|null = null) {
    this.validate();
  }

  // TODO(JabJabJab): This is not currently not overriding anything!
  /** @override */
  validate(): void {
    if (this.x < -1) {
      throw new Error(`The "x" value given is less than -1. (${this.x} given)`);
    } else if (this.x > 1023) {
      throw new Error(`The "x" value given is greater than 1023. (${this.x} given)`);
    }
    if (this.y < -1) {
      throw new Error(`The "y" value given is less than -1. (${this.y} given)`);
    } else if (this.y > 1023) {
      throw new Error(`The "y" value given is greater than 1023. (${this.y} given)`);
    }
    if (this.arena != null) {
      if (this.arena.length > 16) {
        throw new Error('The "arena" string given is longer than 16 characters.');
      }
    }
  }
}

export class ELVLWallTiles implements ELVLChunk {

  static readonly TOP_LEFT_CORNER = 9;
  static readonly TOP_JUNCTION = 13;
  static readonly TOP_RIGHT_CORNER = 12;
  static readonly LEFT_JUNCTION = 11;
  static readonly CENTER = 15;
  static readonly RIGHT_JUNCTION = 14;
  static readonly BOTTOM_LEFT_CORNER = 3;
  static readonly BOTTOM_JUNCTION = 7;
  static readonly BOTTOM_RIGHT_CORNER = 6;
  static readonly VERTICAL_TOP_CAP = 8;
  static readonly VERTICAL = 10;
  static readonly VERTICAL_BOTTOM_CAP = 2;
  static readonly HORIZONTAL_LEFT_CAP = 1;
  static readonly HORIZONTAL = 5;
  static readonly HORIZONTAL_RIGHT_CAP = 4;
  static readonly DOT = 0;

  readonly id = 'DCWT';

  constructor(readonly tiles: number[] = ELVLWallTiles.blankTileData()) {}
  
  private static blankTileData(): number[] {
    const tiles = new Array(16);
    tiles.fill(0);
    return tiles;
  }

  getTile(index: number): number {
    if (index < 0) {
      throw new Error(`The "index" given is negative. (${index} given)`);
    } else if (index > 15) {
      throw new Error(`The "index" given is greater than 15. (${index} given)`);
    }
    return this.tiles[index];
  }

  setTile(index: number, tileId: number): void {
    if (index < 0) {
      throw new Error(`The "index" given is negative. (${index} given)`);
    } else if (index > 15) {
      throw new Error(`The "index" given is greater than 15. (${index} given)`);
    }
    if (tileId < 0) {
      throw new Error(`The "tileId" given is negative. (${tileId} given)`);
    } else if (tileId > 255) {
      throw new Error(`The "tileId" given is greater than 255. (${tileId} given)`);
    }
    this.tiles[index] = tileId;
  }

  unsetTile(index: number): void {
    this.setTile(index, 0);
  }

  /** @override */
  equals(next: ELVLChunk): boolean {
    // Make sure that this is a wall-tile definition.
    if (!(next instanceof ELVLWallTiles)) {
      return false;
    }
    // Check each wall-tile definition.
    for (let index = 0; index < 16; index++) {
      // If these don't match, there's a difference.
      if (next.tiles[index] !== this.tiles[index]) {
        return false;
      }
    }
    // These are both equal.
    return true;
  }

  /** @override */
  validate(): void {
    if (this.tiles.length !== 16) {
      throw new Error('The "tiles" array for the ELVLDCMEWallTile is not a size of 16 numbers.');
    } else {
      // Go through each tile index to make sure that it is a valid tile ID.
      for (let index = 0; index < 16; index++) {
        if (this.tiles[index] < 0) {
          throw new Error(
            `The entry "tiles[${index}]" for the ELVLDCMEWallTile is less than 0. (${this.tiles[index]} assigned)`
          );
        } else if (this.tiles[index] > 255) {
          throw new Error(
            `The entry "tiles[${index}]" for the ELVLDCMEWallTile is greater than 255. (${this.tiles[index]} assigned)`
          );
        }
      }
    }
  }
}

export class ELVLTextTiles implements ELVLChunk {
  readonly id = 'DCTT';
  constructor(readonly charMap: number[] = ELVLTextTiles.blankCharMap()) {}
  
  private static blankCharMap(): number[] {
    const tiles = new Array(256);
    tiles.fill(0);
    return tiles;
  }

  /** @override */
  equals(next: ELVLChunk): boolean {
    return next instanceof ELVLTextTiles && this.charMap.every((el, index) => el === this.charMap[index]);
  }

  /** @override */
  validate(): void {
    if (this.charMap.length != 256) {
      throw new Error(
        `The "charMap" field for the ELVLDCMETextTiles is not 256 in size. (${this.charMap.length} in size)`
      );
    } else {
      for (let index = 0; index < this.charMap.length; index++) {
        const next = this.charMap[index];
        if (next < 0) {
          throw new Error(`"charMap[${index}]" is negative. (${next} assigned)`);
        }
      }
    }
  }
}

export class ELVLHashCode implements ELVLChunk {
  readonly id = 'DCID';

  constructor(readonly hashCode: string) {}

  /** @override */
  equals(next: ELVLChunk): boolean {
    return next instanceof ELVLHashCode && next.hashCode === this.hashCode;
  }

  /** @override */
  validate(): void {}
}

export class ELVLBookmarks extends ELVLRawChunk {
  constructor(data: Buffer) {
    super('DCBM', data);
  }
}

export class ELVLLVZPath extends ELVLRawChunk {
  constructor(data: Buffer) {
    super('DCLV', data);
  }
}

export interface ELVLRegionOptions {
  isFlagBase: boolean;
  noAntiWarp: boolean;
  noWeapons: boolean;
  noFlagDrops: boolean;
}
