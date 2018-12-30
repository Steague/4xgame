import BlueNoise from './BlueNoise';
import Point from './Point';
import _ from 'lodash';
import  localStorage from 'localStorage';
import graphlib from 'graphlib';
import {Delaunay} from "d3-delaunay";

export const MAP_K = 30;
export const MAP_RADIUS = 30;
export const MAP_SIZE = 900;

export default class Map {
    constructor() {
        this.noiseK = MAP_K;
        this.noiseRadius = MAP_RADIUS;
        this.size = MAP_SIZE;

        this.voronoi = null;
    }

    /* Direct Node Actions */
    setNode(id, payload, update = true) {
        if (update) {
            payload = {
                ...this.graph.node(id),
                ...payload
            };
        }
        this.graph.setNode(id, {
            ...payload
        });

        this.save();
    }

    generateNoise() {
        return (new BlueNoise())
            .poissonDiskSampling(
                this.noiseK,
                this.noiseRadius,
                this.size
            );
    }

    getHexString(iterations, i) {
        let hexString = parseInt(256 - ((256 / iterations) * i), 10).toString(16);
        if (hexString.length % 2) {
            hexString = '0' + hexString;
        }

        return hexString;
    }

    relax(pointArray, iterations) {
        let newPointArray = [];
        for (let i = 0; i < iterations; i++) {
            const delaunay = Delaunay.from(pointArray, (p) => p.x, (p) => p.y);
            const voronoi = delaunay.voronoi([0, 0, this.size, this.size]);
            _.forEach(pointArray, (point, id) => {
                const myCentroid = this.getCentroid(_.map(voronoi.cellPolygon(id), point => new Point(point[0], point[1])));
                newPointArray[id] = new Point(myCentroid.x, myCentroid.y);
            });

            pointArray = newPointArray;
        }

        return pointArray;
    }

    isOutsideMaxDistance(point, {from, maxDistance}) {
        return (point.distanceFrom(from) < maxDistance);
    }

    removeFarNodes(points, {from, maxDistance}) {
        const newPoints = [];
        _.forEach(points, point => {
            if (this.isOutsideMaxDistance(point, {from, maxDistance})) {
                newPoints.push(point);
            }
        });

        return newPoints;
    }

    removeCloseNodes(points, {from, minDistance}) {
        const newPoints = [];
        _.forEach(points, point => {
            if (point.distanceFrom(from) > minDistance) {
                newPoints.push(point);
            }
        });

        return newPoints;
    }

    generateNew() {
        let mapPoints = this.generateNoise();
        mapPoints = this.relax(mapPoints, 20);
        const delaunay = Delaunay.from(mapPoints, (p) => p.x, (p) => p.y);
        this.voronoi = delaunay.voronoi([0, 0, this.size, this.size]);

        _.forEach(mapPoints, (point, id) => {
            const cellPolygon = _.map(this.voronoi.cellPolygon(id), point => new Point(point[0], point[1]));
            this.graph.setNode(id, {
                region  : cellPolygon,
                visible : false,
                claimed : false,
                point
            });
        });

        const { triangles, points } = delaunay;

        for (let i = 0, j = triangles.length / 3; i < j; ++i) {
            const t0 = triangles[i * 3 + 0];
            const t1 = triangles[i * 3 + 1];
            const t2 = triangles[i * 3 + 2];

            // Add each edge direction
            const distance1 = (new Point(points[t0 * 2 + 0], points[t0 * 2 + 1]))
                .distanceFrom(new Point(points[t1 * 2 + 0], points[t1 * 2 + 1]));
            const distance2 = (new Point(points[t1 * 2 + 0], points[t1 * 2 + 1]))
                .distanceFrom(new Point(points[t2 * 2 + 0], points[t2 * 2 + 1]));
            const distance3 = (new Point(points[t2 * 2 + 0], points[t2 * 2 + 1]))
                .distanceFrom(new Point(points[t0 * 2 + 0], points[t0 * 2 + 1]));

            if (distance1 < this.noiseRadius*2) {
                this.graph.setEdge(t0, t1);
                this.graph.setEdge(t1, t0);
            }

            if (distance2 < this.noiseRadius*2) {
                this.graph.setEdge(t1, t2);
                this.graph.setEdge(t2, t1);
            }

            if (distance3 < this.noiseRadius*2) {
                this.graph.setEdge(t2, t0);
                this.graph.setEdge(t0, t2);
            }
        }

        _.forEach(this.graph.nodes(), node => {
            const nodeInfo = this.graph.node(node);
            if (!this.isOutsideMaxDistance(nodeInfo.point, {
                from : {
                    x : (this.size / 2),
                    y : (this.size / 2)
                },
                maxDistance : (this.size / 2) - (this.noiseRadius * 2)//(this.size * 0.05)
            })) {
                this.graph.removeNode(node);
                return;
            }

            if (this.isOutsideMaxDistance(nodeInfo.point, {
                from : {
                    x : (this.size / 2),
                    y : (this.size / 2)
                },
                maxDistance : (this.size / 2) * 0.25
            })) {
                this.graph.removeNode(node);
                return;
            }

            if (this.graph.nodeEdges(node).length > 12) {
                this.graph.removeNode(node);
                return;
            }
        });
    }

    getArea(region) {
        let area = 0,
            point1,
            point2;

        for (let i = 0, j = region.length - 1; i < region.length; j=i,i++) {
            point1 = region[i];
            point2 = region[j];
            area += point1.x * point2.y;
            area -= point1.y * point2.x;
        }
        area /= 2;

        return area;
    }

    getCentroid(region) {
        let x = 0,
            y = 0,
            f,
            point1,
            point2;

        for (let i = 0, j = region.length - 1; i < region.length; j=i,i++) {
            point1 = region[i];
            point2 = region[j];
            f = point1.x * point2.y - point2.x * point1.y;
            x += (point1.x + point2.x) * f;
            y += (point1.y + point2.y) * f;
        }

        f = this.getArea(region) * 6;

        return new Point(x / f, y / f);
    }

    toString() {
        const graphState = {};
        const nodes = this.graph.nodes();
        graphState["edges"] = this.graph.edges();
        graphState["nodes"] = {};
        _.forEach(nodes, id => {
            graphState["nodes"][id] = this.graph.node(id);
        });
        return JSON.stringify(graphState);
    }

    save() {
        const gameState = this.toString();
        localStorage.setItem('map', gameState);
    }

    load() {
        let map = localStorage.getItem('map');
        if (map === null) {
            this.generateNew();
            this.save();
        } else {
            map = JSON.parse(map);
            this.graph = map;
        }

        return this;
    }

    node(id) {
        return this.graph.node(id);
    }

    nodeEdges(v, w) {
        return this.graph.nodeEdges(v, w);
    }

    nodes() {
        return this.graph.nodes();
    }

    get graph() {
        return this._graph || (this._graph = new graphlib.Graph({directed : false}));
    }

    set graph(graph) {
        this._graph = new graphlib.Graph({directed : false});
        const { nodes, edges } = graph;
        _.forEach(_.keys(nodes), id => {
            this.graph.setNode(id, nodes[id]);
        });
        _.forEach(edges, obj => {
            this.graph.setEdge({...obj});
        });
    }
}
