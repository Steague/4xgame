export default class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    addVector(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }

    distanceFrom(vector) {
        let a = this.x - vector.x;
        let b = this.y - vector.y;

        return Math.sqrt(a*a + b*b);
    }
}
