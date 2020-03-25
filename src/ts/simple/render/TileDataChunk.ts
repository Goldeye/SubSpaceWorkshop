import { TileData } from '../../util/map/TileData';
import { UpdatedObject } from '../../util/UpdatedObject';
import { Session } from '../Session';
import { MapArea } from '../../util/map/MapArea';
import { CoordinateType } from '../../util/map/CoordinateType';

export class TileDataChunk extends UpdatedObject {

    public static readonly LENGTH = 64;

    private readonly session: Session;
    private readonly tiles: TileData;
    private readonly x: number;
    private readonly y: number;

    private bounds: MapArea;
    tileMap: any;
    tileMapAnim: any;
    private tilesAnim: LVLChunkEntry[];

    constructor(session: Session, tiles: TileData, x: number, y: number) {

        super();

        this.session = session;

        this.tiles = tiles;

        this.setRequireDirtyToUpdate(false);

        this.x = x;
        this.y = y;
        this.bounds = new MapArea(
            CoordinateType.TILE,
            x * 64,
            y * 64,
            ((x + 1) * 64) - 1,
            ((y + 1) * 64) - 1
        );
    }

    init(): void {

        if (this.tileMap != null) {
            this.tileMap.clear();
            this.tileMap = null;
        }

        if (this.tileMapAnim != null) {
            this.tileMapAnim.clear();
            this.tileMapAnim = null;
        }

        this.tilesAnim = [];

        let atlas = this.session.atlas;

        // @ts-ignore
        this.tileMap = new PIXI.tilemap.CompositeRectTileLayer(0, [
            atlas.getTextureAtlas('tiles'),
            atlas.getTextureAtlas('tile191'),
            atlas.getTextureAtlas('tile'),
            atlas.getTextureAtlas('tilenoradar'),
            atlas.getTextureAtlas('tilenobrick'),
            atlas.getTextureAtlas('tilenoweapon'),
            atlas.getTextureAtlas('tilenothor')
        ]);

        // @ts-ignore
        this.tileMapAnim = new PIXI.tilemap.CompositeRectTileLayer(0, [
            atlas.getTextureAtlas('tiles'),
            atlas.getTextureAtlas('over1'),
            atlas.getTextureAtlas('over2'),
            atlas.getTextureAtlas('over3'),
            atlas.getTextureAtlas('over4'),
            atlas.getTextureAtlas('over5'),
            atlas.getTextureAtlas('flag'),
            atlas.getTextureAtlas('goal'),
            atlas.getTextureAtlas('prizes'),
            atlas.getTextureAtlas('wall'),
        ]);

        this.setDirty(true);
    }

    // @Override
    public isDirty(): boolean {
        return super.isDirty() || this.tiles.isDirty();
    }

    // @Override
    public onUpdate(delta: number): boolean {

        if (this.tileMap == null) {
            return;
        }

        let renderer = this.session.editor.renderer;
        let camera = renderer.camera;
        let tileset = this.session.tileset;

        if (camera.isDirty()) {
            let cameraPosition = camera.position;
            let scale = cameraPosition.scale;
            let invScale = 1 / scale;
            let screen = renderer.app.screen;
            let sw = screen.width * invScale;
            let sh = screen.height * invScale;
            let x = Math.floor((-1 + ((this.x * 64) - (cameraPosition.x * 16) + sw / 2)) - (this.x * 64));
            let y = 1 + Math.floor(((this.y * 64) - (cameraPosition.y * 16) + sh / 2) - (this.y * 64));
            this.tileMap.x = this.tileMapAnim.x = x * scale;
            this.tileMap.y = this.tileMapAnim.y = y * scale;
            this.tileMap.scale.x = this.tileMap.scale.y = cameraPosition.scale;
            this.tileMapAnim.scale.x = this.tileMapAnim.scale.y = cameraPosition.scale;
        }

        let x1 = this.bounds.x1;
        let y1 = this.bounds.y1;
        let x2 = this.bounds.x2;
        let y2 = this.bounds.y2;

        let atlas = this.session.atlas;
        if (atlas.isDirty() || this.tiles.containsDirtyArea(x1, y1, x2, y2)) {
            this.draw();
        }

        this.tileMapAnim.clear();

        for (let index = 0; index < this.tilesAnim.length; index++) {

            let next = this.tilesAnim[index];

            // Grab the next tile.
            let id = next.id;
            let texture = next.texture;
            let x = next.x;
            let y = next.y;

            let frame = null;

            if (id >= 162 && id <= 165) {
                frame = atlas.getTextureAtlas('tiles').getSpriteById('door01').current;
            } else if (id >= 166 && id <= 169) {
                frame = atlas.getTextureAtlas('tiles').getSpriteById('door02').current;
            } else if (id == 170) {
                frame = atlas.getTextureAtlas('flag').getSpriteById('flagblue').current;
            } else if (id == 172) {
                frame = atlas.getTextureAtlas('goal').getSpriteById('goalblue').current;
            } else if (id == 216) {
                texture = 3;
                frame = atlas.getTextureAtlas('over1').getSpriteById('over1').current;
            } else if (id == 217) {
                frame = atlas.getTextureAtlas('over2').getSpriteById('over2').current;
            } else if (id == 218) {
                frame = atlas.getTextureAtlas('over3').getSpriteById('over3').current;
            } else if (id == 219) {
                frame = atlas.getTextureAtlas('over4').getSpriteById('over4').current;
            } else if (id == 220) {
                frame = atlas.getTextureAtlas('over5').getSpriteById('over5').current;
            } else if (id == 252) {
                frame = atlas.getTextureAtlas('wall').getSpriteById('wallblue').current;
            } else if (id == 253) {
                frame = atlas.getTextureAtlas('wall').getSpriteById('wallyellow').current;
            } else if (id == 255) {
                frame = atlas.getTextureAtlas('prizes').getSpriteById('prizes').current;
            }

            if (frame != null) {
                this.tileMapAnim.addRect(texture, frame[0], frame[1], x, y, frame[2], frame[3]);
            } else {
                let tileCoordinates = tileset.getTileCoordinates(next.id);
                let tu = tileCoordinates[0];
                let tv = tileCoordinates[1];
                this.tileMapAnim.addRect(texture, tu, tv, x, y, 16, 16);
            }
        }

        // this.tiles.setDirty(false);

        return true;
    }

    draw() {

        let session = this.session;
        if (session == null) {
            return;
        }

        let tiles = this.tiles.getTiles(false);
        let tileset = this.session.tileset;
        let atlas = session.atlas;

        if (atlas.isDirty()) {
            this.tileMap.setBitmaps([
                atlas.getTextureAtlas('tiles').texture,
                atlas.getTextureAtlas('tile191').texture,
                atlas.getTextureAtlas('tile').texture,
                atlas.getTextureAtlas('tilenoradar').texture,
                atlas.getTextureAtlas('tilenobrick').texture,
                atlas.getTextureAtlas('tilenoweapon').texture,
                atlas.getTextureAtlas('tilenothor').texture
            ]);

            this.tileMapAnim.setBitmaps([
                atlas.getTextureAtlas('tiles').texture,
                atlas.getTextureAtlas('over1').texture,
                atlas.getTextureAtlas('over2').texture,
                atlas.getTextureAtlas('over3').texture,
                atlas.getTextureAtlas('over4').texture,
                atlas.getTextureAtlas('over5').texture,
                atlas.getTextureAtlas('flag').texture,
                atlas.getTextureAtlas('goal').texture,
                atlas.getTextureAtlas('prizes').texture,
                atlas.getTextureAtlas('wall').texture,
            ]);
        }
        this.tileMap.clear();
        this.tilesAnim = [];

        // Go through each tile position on the raster and add tiles when present.
        for (let x = this.x * 64; x < (this.x + 1) * 64; x++) {
            for (let y = this.y * 64; y < (this.y + 1) * 64; y++) {

                // Grab the next tile.
                let tileId = tiles[x][y];

                if (tileId > 0 && tileId <= 190) {

                    let tileCoordinates = tileset.getTileCoordinates(tileId);
                    let tu = tileCoordinates[0];
                    let tv = tileCoordinates[1];

                    if (tileId >= 162 && tileId <= 165) {
                        this.tilesAnim.push({
                            x: x * 16,
                            y: y * 16,
                            texture: 0,
                            id: tileId
                        });
                    } else if (tileId >= 166 && tileId <= 169) {
                        this.tilesAnim.push({
                            x: x * 16,
                            y: y * 16,
                            texture: 0,
                            id: tileId
                        });
                    } else if (tileId == 170) {
                        this.tilesAnim.push({
                            x: x * 16,
                            y: y * 16,
                            texture: 6,
                            id: tileId
                        });

                    } else if (tileId == 172) {
                        this.tilesAnim.push({
                            x: x * 16,
                            y: y * 16,
                            texture: 7,
                            id: tileId
                        });

                    }
                        // These tiles are see-through in-game, so set these in animation tilemap
                    //       So that they are see-through.
                    else if (tileId >= 173 && tileId <= 190) {
                        this.tilesAnim.push({
                            x: x * 16,
                            y: y * 16,
                            texture: 0,
                            id: tileId
                        });
                    } else {

                        // @ts-ignore
                        this.tileMap.addRect(0, tu, tv, x * 16, y * 16, 16, 16);

                    }

                } else if (tileId === 191) {
                    // @ts-ignore
                    this.tileMap.addRect(1, 0, 0, x * 16, y * 16, 16, 16);
                } else if ((tileId >= 192 && tileId <= 215) || (tileId >= 221 && tileId <= 240)) {
                    // @ts-ignore
                    this.tileMap.addRect(2, 0, 0, x * 16, y * 16, 16, 16);
                } else if (tileId >= 216 && tileId <= 220) {

                    let texture = 0;
                    if (tileId == 216) {
                        texture = 1;
                    } else if (tileId == 217) {
                        texture = 2;
                    } else if (tileId == 218) {
                        texture = 3;
                    } else if (tileId == 219) {
                        texture = 4;
                    } else if (tileId == 220) {
                        texture = 5;
                    }

                    this.tilesAnim.push({
                        id: tileId,
                        texture: texture,
                        x: x * 16,
                        y: y * 16
                    });
                } else if ((tileId === 241)) {
                    // @ts-ignore
                    this.tileMap.addRect(5, 0, 0, x * 16, y * 16, 16, 16);
                } else if ((tileId === 242)) {
                    // @ts-ignore
                    this.tileMap.addRect(6, 0, 0, x * 16, y * 16, 16, 16);
                } else if ((tileId >= 243 && tileId <= 251)) {
                    // @ts-ignore
                    this.tileMap.addRect(3, 0, 0, x * 16, y * 16, 16, 16);
                } else if ((tileId === 252)) {
                    this.tilesAnim.push({
                        id: tileId,
                        texture: 9,
                        x: x * 16,
                        y: y * 16
                    });
                } else if ((tileId === 253)) {
                    this.tilesAnim.push({
                        id: tileId,
                        texture: 9,
                        x: x * 16,
                        y: y * 16
                    });
                } else if ((tileId === 254)) {
                    // @ts-ignore
                    this.tileMap.addRect(4, 0, 0, x * 16, y * 16, 16, 16);
                } else if ((tileId === 255)) {
                    this.tilesAnim.push({
                        id: tileId,
                        texture: 8,
                        x: x * 16,
                        y: y * 16
                    });
                } else {
                    let tileCoordinates = tileset.getTileCoordinates(tileId);
                    if (tileCoordinates != null) {
                        let tu = tileCoordinates[0];
                        let tv = tileCoordinates[1];
                        // @ts-ignore
                        this.tileMap.addRect(1, tu, tv, x * 16, y * 16, 16, 16);
                    }
                }
            }
        }

        console.log(this);
    }

    getBounds(): MapArea {
        return this.bounds;
    }
}

/**
 * The <i>LVZChunkEntry</i> interface. TODO: Document.
 */
interface LVLChunkEntry {
    id: number,
    texture: number,
    x: number,
    y: number
}