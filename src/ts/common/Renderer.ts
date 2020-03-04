import * as fs from "fs";
import * as PIXI from "pixi.js";
import Filter = PIXI.Filter;
import { UpdatedObject } from '../util/UpdatedObject';
import { Path, PathCoordinates, PathMode } from '../util/Path';
import { KeyListener } from '../util/KeyListener';
import { LVL } from '../io/LVLUtils';
import { Background } from './Background';

const Stats = require("stats.js");

/**
 * The <i>Renderer</i> class. TODO: Document.
 *
 * @author Jab
 */
export abstract class Renderer extends UpdatedObject {

    static fragmentSrc = fs.readFileSync("assets/glsl/pixi_chroma.frag").toString();
    static chromaFilter = new Filter(undefined, Renderer.fragmentSrc, undefined);

    app: PIXI.Application;
    camera: Camera;
    stats: Stats;
    events: RenderEvents;

    background: Background;

    protected constructor() {

        super();

        this.camera = new Camera();
    }

    init(container: HTMLElement, id: string = 'viewport', stats: boolean): void {

        PIXI.settings.RESOLUTION = window.devicePixelRatio;
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.RENDER_OPTIONS.antialias = false;
        PIXI.settings.RENDER_OPTIONS.forceFXAA = false;
        PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
        PIXI.settings.SPRITE_MAX_TEXTURES = 1024;

        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
            antialias: false,
            forceFXAA: false,
            clearBeforeRender: true
        });

        this.app.ticker.add((delta) => {

            if (this.stats != null) {
                this.stats.begin();
            }

            this.updateCamera(delta);

            if (this.background.visible && this.camera.isDirty()) {
                this.background.update();
            }

            this.onPreUpdate(delta);
            this.update(delta);

            if (this.stats != null) {
                this.stats.end();
            }
        });

        this.app.view.id = id;
        this.app.stage.interactive = true;

        if (stats) {
            this.initStats();
        }

        this.background = new Background(this);

        let stage = this.app.stage;
        stage.addChild(this.background);

        this.events = new RenderEvents(this);

        this.onInit();

        container.appendChild(this.app.view);

        let resize = () => {

            // Resize the renderer
            let width = container.clientWidth;
            let height = container.clientHeight;
            this.app.renderer.resize(width - 2, height - 2);
            this.setDirty(true);

            let $leftTabMenu = $('#editor-left-tab-menu');
            $leftTabMenu.css({top: (window.innerHeight - 49) + 'px'});
        };

        resize();

        // Listen for window resize events
        window.addEventListener('resize', resize);

        this.setDirty(true);
    }

    private initStats(): void {
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);
    }

    private updateCamera(delta: number): void {
        let sw = this.app.view.width;
        let sh = this.app.view.height;

        let cPos = this.camera.position;
        let cx = cPos.x * 16;
        let cy = cPos.y * 16;

        this.camera.bounds.x = cx - sw / 2.0;
        this.camera.bounds.y = cy - sh / 2.0;
        this.camera.bounds.width = sw;
        this.camera.bounds.height = sh;
        this.camera.update(delta);
    }

    protected abstract onInit(): void;

    protected abstract onPreUpdate(delta: number): void;
}

export class RenderEvents {

    readonly mouseListeners: ((event: MapMouseEvent) => void)[];

    readonly renderer: Renderer;

    constructor(renderer: Renderer) {

        this.renderer = renderer;
        this.mouseListeners = [];

        renderer.app.stage.interactive = true;

        let down = false;

        this.renderer.app.view.addEventListener('pointerupoutside', (e) => {
            down = false;

            let sw = this.renderer.app.screen.width;
            let sh = this.renderer.app.screen.height;
            let mapSpace = this.renderer.camera.toMapSpace(-999999, -999999, sw, sh);

            this.dispatch({
                data: mapSpace,
                type: MapMouseEventType.UP,
                button: -999999,
                e: null
            });
        });

        this.renderer.app.view.addEventListener('pointerdown', (e) => {
            down = true;

            let sx = e.offsetX;
            let sy = e.offsetY;
            let sw = this.renderer.app.screen.width;
            let sh = this.renderer.app.screen.height;
            let mapSpace = this.renderer.camera.toMapSpace(sx, sy, sw, sh);

            this.dispatch({data: mapSpace, type: MapMouseEventType.DOWN, button: e.button, e: e});
        });

        this.renderer.app.view.addEventListener('pointerup', (e) => {
            down = false;

            let sx = e.offsetX;
            let sy = e.offsetY;
            let sw = this.renderer.app.screen.width;
            let sh = this.renderer.app.screen.height;
            let mapSpace = this.renderer.camera.toMapSpace(sx, sy, sw, sh);

            this.dispatch({data: mapSpace, type: MapMouseEventType.UP, button: e.button, e: e});
        });

        this.renderer.app.view.addEventListener('pointermove', (e) => {
            let sx = e.offsetX;
            let sy = e.offsetY;
            let sw = this.renderer.app.screen.width;
            let sh = this.renderer.app.screen.height;
            let mapSpace = this.renderer.camera.toMapSpace(sx, sy, sw, sh);

            this.dispatch({
                data: mapSpace,
                type: down ? MapMouseEventType.DRAG : MapMouseEventType.HOVER,
                button: e.button,
                e: e
            });
        });

        this.renderer.app.view.addEventListener('wheel', (e: WheelEvent) => {
            let sx = e.offsetX;
            let sy = e.offsetY;
            let sw = this.renderer.app.screen.width;
            let sh = this.renderer.app.screen.height;
            let mapSpace = this.renderer.camera.toMapSpace(sx, sy, sw, sh);
            let type = e.deltaY < 0 ? MapMouseEventType.WHEEL_UP : MapMouseEventType.WHEEL_DOWN;
            this.dispatch({data: mapSpace, type: type, button: 1, e: e});
            return false;
        }, false);
    }

    dispatch(event: MapMouseEvent): void {
        if (this.mouseListeners.length != 0) {
            for (let index = 0; index < this.mouseListeners.length; index++) {
                this.mouseListeners[index](event);
            }
        }
    }

    addMouseListener(listener: (event: MapMouseEvent) => void): void {

        // Make sure that the renderer doesn't have the listener.
        if (this.hasMouseListener(listener)) {
            throw new Error("The mouse listener is already registered.");
        }

        this.mouseListeners.push(listener);
    }

    removeMouseListener(listener: (event: MapMouseEvent) => void): void {

        // Make sure that the renderer has the listener.
        if (!this.hasMouseListener(listener)) {
            throw new Error("The mouse listener is not registered.");
        }

        // If the listener is the last entry, simply pop it from the array.
        if (this.mouseListeners[this.mouseListeners.length - 1] === listener) {
            this.mouseListeners.pop();
            return;
        }

        let toAdd: ((event: MapMouseEvent) => void)[] = [];

        // Go through each entry until the one to remove is found.
        while (true) {

            let next = this.mouseListeners.pop();
            if (next === listener) {
                break;
            }

            toAdd.push(next);
        }

        // Add them back in reverse order to preserve the original sequence.
        for (let index = toAdd.length - 1; index >= 0; index--) {
            this.mouseListeners.push(toAdd[index]);
        }
    }

    hasMouseListener(listener: (event: MapMouseEvent) => void) {

        for (let index = 0; index < this.mouseListeners.length; index++) {

            let next = this.mouseListeners[index];

            if (next === listener) {
                return true;
            }
        }

        return false;
    }
}

/**
 * The <i>Camera</i> class. TODO: Document.
 *
 * @author Jab
 */
export class Camera extends UpdatedObject {

    path: Path;
    alt: KeyListener;
    bounds: PIXI.Rectangle;
    coordinateMin: number;
    coordinateMax: number;

    position: { x: number, y: number, scale: number };
    private positionPrevious: { x: number, y: number, scale: number };
    private shift: boolean;
    private readonly keys: { [key: string]: boolean };

    /**
     * Main constructor.
     */
    constructor() {

        super();

        this.keys = {};
        window.onkeyup = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        window.onkeydown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
        };

        this.path = new Path();

        this.shift = false;

        this.setRequireDirtyToUpdate(false);

        this.coordinateMin = 0;
        this.coordinateMax = LVL.MAP_LENGTH;

        // Set the initial position to be the center of the map with the default scale.
        this.position = {
            x: 0, //this.coordinateMax / 2,
            y: 0, //this.coordinateMax / 2,
            scale: 0.5
        };

        this.positionPrevious = {
            x: this.position.x,
            y: this.position.y,
            scale: this.position.scale
        };

        this.bounds = new PIXI.Rectangle(0, 0, 0, 0);

        // new KeyListener("Shift", () => {
        //     this.shift = true;
        // }, null, () => {
        //     this.shift = false;
        // });

        // Make sure anything dependent on the camera being dirty renders on the first
        // render call.
        this.setDirty(true);
    }

    // @Override
    onUpdate(delta: number): boolean {

        this.path.update();

        let speed = 1 / this.position.scale;
        if (this.isKeyDown("shift")) {
            speed *= 2;
        }

        let up = this.isKeyDown("arrowup") || this.isKeyDown("w");
        let down = this.isKeyDown("arrowdown") || this.isKeyDown("s");
        let left = this.isKeyDown("arrowleft") || this.isKeyDown("a");
        let right = this.isKeyDown("arrowright") || this.isKeyDown("d");

        if (up != down) {

            if (up) {
                this.position.y -= speed;
                this.path.cancel(this.position.x, this.position.y, false);
                this.setDirty(true);
            }

            if (down) {
                this.position.y += speed;
                this.path.cancel(this.position.x, this.position.y, false);
                this.setDirty(true);
            }

            if (this.position.y <= this.coordinateMin) {
                this.position.y = this.coordinateMin;
                this.path.cancel(this.position.x, this.position.y, false);
            } else if (this.position.y >= this.coordinateMax) {
                this.position.y = this.coordinateMax;
                this.path.cancel(this.position.x, this.position.y, false);
            }
        }

        if (left != right) {

            if (left) {
                this.position.x -= speed;
                this.path.cancel(this.position.x, this.position.y, false);
                this.setDirty(true);
            }

            if (right) {
                this.position.x += speed;
                this.path.cancel(this.position.x, this.position.y, false);
                this.setDirty(true);
            }

            if (this.position.x <= this.coordinateMin) {
                this.position.x = this.coordinateMin;
                this.path.cancel(this.position.x, this.position.y, false);
            } else if (this.position.x >= this.coordinateMax) {
                this.position.x = this.coordinateMax;
                this.path.cancel(this.position.x, this.position.y, false);
            }
        }

        if (this.positionPrevious.x !== this.position.x || this.positionPrevious.y !== this.position.y || this.positionPrevious.scale !== this.position.scale) {

            this.setDirty(true);

            this.positionPrevious.x = this.position.x;
            this.positionPrevious.y = this.position.y;
            this.positionPrevious.scale = this.position.scale;
        }

        if (this.isKeyDown('1')) {
            this.pathTo({x: 0, y: 0, scale: 1});
        }
        if (this.isKeyDown('2')) {
            this.pathTo({x: this.coordinateMax, y: 0, scale: 1});
        }
        if (this.isKeyDown('3')) {
            this.pathTo({x: 0, y: this.coordinateMax, scale: 1});
        }
        if (this.isKeyDown('4')) {
            this.pathTo({x: this.coordinateMax, y: this.coordinateMax, scale: 1});
        }
        if (this.isKeyDown('5')) {
            this.pathTo({x: this.coordinateMax / 2, y: this.coordinateMax / 2, scale: 1});
        }

        return true;
    }

    toMapSpace(sx: number, sy: number, sw: number, sh: number, scale: number = null): MapSpace {

        if (scale == null) {
            scale = this.position.scale;
        }

        let tileLength = 16 * scale;
        let cx = this.position.x * tileLength;
        let cy = this.position.y * tileLength;
        let mx = Math.floor(cx + (sx - (sw / 2.0)));
        let my = Math.floor(cy + (sy - (sh / 2.0)));
        let tx = Math.floor(mx / tileLength);
        let ty = Math.floor(my / tileLength);
        return {x: mx, y: my, tileX: tx, tileY: ty};
    };

    pathTo(coordinates: PathCoordinates, ticks: number = 1, mode: PathMode = PathMode.LINEAR) {

        let callback = (x: number, y: number, scale: number): void => {

            if (x != null) {
                this.position.x = x;
            }
            if (y != null) {
                this.position.y = y;
            }
            if (scale != null) {
                this.position.scale = scale;
            }
            if (x != null || y != null || scale != null) {
                this.setDirty(true);
            }
        };

        this.path.x = this.position.x;
        this.path.y = this.position.y;
        this.path.scale = this.position.scale;

        this.path.to(coordinates, [callback], ticks, mode);
    }

    isKeyDown(key: string) {
        return this.keys[key] === true;
    }
}

export interface MapMouseEvent {
    type: MapMouseEventType,
    data: MapSpace,
    button: number,
    e: MouseEvent
}

export interface MapSpace {
    tileX: number,
    tileY: number,
    x: number,
    y: number
}

export enum MapMouseEventType {
    DOWN = 'down',
    UP = 'up',
    DRAG = 'drag',
    HOVER = 'hover',
    ENTER = 'enter',
    EXIT = 'exit',
    WHEEL_UP = 'wheel_up',
    WHEEL_DOWN = 'wheel_down'
}