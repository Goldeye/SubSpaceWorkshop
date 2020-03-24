/**
 * The <i>Boundary</i> class. TODO: Document.
 *
 * @author Jab
 */
import { CoordinateType } from './CoordinateType';

/**
 * The <i>Boundary</i> class. TODO: Document.
 *
 * @author Jab
 */
export class MapArea {

    readonly type: CoordinateType;

    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;

    /**
     * Main constructor.
     *
     * @param type
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    constructor(type: CoordinateType, x1: number, y1: number, x2: number, y2: number) {
        this.type = type;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    set1(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(x),
            Math.floor(y),
            this.x2,
            this.y2
        );
    }

    set2(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            this.x1,
            this.y1,
            Math.floor(x),
            Math.floor(y)
        );
    }

    mul(x1: number, y1: number, x2: number, y2: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 * x1),
            Math.floor(this.y1 * y1),
            Math.floor(this.x2 * x2),
            Math.floor(this.y2 * y2)
        );
    }

    mul1(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 * x),
            Math.floor(this.y1 * y),
            this.x2,
            this.y2
        );
    }

    mul2(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            this.x1,
            this.y1,
            Math.floor(this.x2 * x),
            Math.floor(this.y2 * y)
        );
    }

    div(x1: number, y1: number, x2: number, y2: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 / x1),
            Math.floor(this.y1 / y1),
            Math.floor(this.x2 / x2),
            Math.floor(this.y2 / y2)
        );
    }

    div1(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 / x),
            Math.floor(this.y1 / y),
            this.x2,
            this.y2
        );
    }

    div2(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            this.x1,
            this.y1,
            Math.floor(this.x2 / x),
            Math.floor(this.y2 / y)
        );
    }

    add(x1: number, y1: number, x2: number, y2: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 + x1),
            Math.floor(this.y1 + y1),
            Math.floor(this.x2 + x2),
            Math.floor(this.y2 + y2)
        );
    }

    add1(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 + x),
            Math.floor(this.y1 + y),
            this.x2,
            this.y2
        );
    }

    add2(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            this.x1,
            this.y1,
            Math.floor(this.x2 + x),
            Math.floor(this.y2 + y)
        );
    }

    sub(x1: number, y1: number, x2: number, y2: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 - x1),
            Math.floor(this.y1 - y1),
            Math.floor(this.x2 - x2),
            Math.floor(this.y2 - y2)
        );
    }

    sub1(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            Math.floor(this.x1 - x),
            Math.floor(this.y1 - y),
            this.x2,
            this.y2
        );
    }

    sub2(x: number, y: number): MapArea {
        return new MapArea(
            this.type,
            this.x1,
            this.y1,
            Math.floor(this.x2 - x),
            Math.floor(this.y2 - y)
        );
    }

    /**
     * Converts the Boundary coordinates to the specified coordinate type.
     *
     * @param type
     */
    asType(type: CoordinateType): MapArea {

        let x1 = this.x1;
        let y1 = this.y1;
        let x2 = this.x2;
        let y2 = this.y2;

        if (type === CoordinateType.TILE) {

            if (this.type === CoordinateType.TILE) {
                return new MapArea(CoordinateType.TILE, x1, y1, x2, y2);
            } else {

                x1 = Math.floor(x1 / 16);
                y1 = Math.floor(y1 / 16);
                x2 = Math.floor(x2 / 16);
                y2 = Math.floor(y2 / 16);
                return new MapArea(CoordinateType.TILE, x1, y1, x2, y2);
            }
        } else if (type === CoordinateType.PIXEL) {

            if (this.type === CoordinateType.TILE) {

                x1 *= 16;
                y1 *= 16;
                x2 *= 16;
                y2 *= 16;
                return new MapArea(CoordinateType.PIXEL, x1, y1, x2, y2);
            } else {
                return new MapArea(CoordinateType.PIXEL, x1, y1, x2, y2);
            }
        }
    }
}
