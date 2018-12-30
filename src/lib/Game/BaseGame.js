import Map from '../Map';
import _ from 'lodash';

class BaseGame {
    /**************************************************************************\
    Public Methods
    \**************************************************************************/
    constructor() {
        this.playerId = 1;

        //load the map
        this.map.load();
    }

    areNeighbors(id, id2) {
        return (_.findIndex(this.map.graph.neighbors(id), i => i === id2) !== -1);
    }

    claimNode(id, metaData) {
        // console.log({
        //     claimed : true,
        //     ...metaData
        // });
        this.map.setNode(id, {
            claimed : true,
            ...metaData
        });
    }

    claimRandomNode(metaData) {
        // check for home node before making a new one
        const nodes = this.map.nodes();
        const homeIndex = _.findIndex(nodes, id => {
            const { owner, home } = this.map.node(id);
            return (home && owner === this.playerId);
        });
        if (homeIndex !== -1) {
            return nodes[homeIndex];
        }

        const homeNodeId = nodes[Math.floor(Math.random() * (nodes.length - 1))];
        this.claimNode(homeNodeId, metaData);

        return homeNodeId;
    }

    moveTo(point, scale = 1, duration = 1000) {
        const newCameraPosition = {
            position  : point,
            animation : {duration, easingFunction : "easeInOutQuad"},
            scale
        };
        this.network.moveTo(newCameraPosition);
    }

    goToNode(node) {
        this.moveTo(this.map.node(node).point, 2);
    }

    addRegion(node, color, prefix) {
        const nodes = [];
        const edges = [];
        const nodeInfo = this.map.node(node);
        let prevPoint = null;
        _.forEach(nodeInfo.region, (point, id) => {
            nodes.push({
                id      : `${prefix}_${node}_${id}`,
                x       : point.x,
                y       : point.y,
                fixed   : true,
                physics : false,
                shape   : "dot",
                size    : 0.5,
                color
            });

            if (prevPoint !== null) {
                edges.push({
                    id     : `${prefix}_${node}_${prevPoint}_${id}`,
                    from   : `${prefix}_${node}_${prevPoint}`,
                    to     : `${prefix}_${node}_${id}`,
                    width  : 1,
                    arrows : '',
                    color  : {color}
                });
            }

            prevPoint = id;
        });

        return {
            nodes, edges
        };
    }





    /**************************************************************************\
    Private Methods
    \**************************************************************************/

    _setUnclaimedNeighborsAsVisible() {
        _.forEach(this.unclaimedNeighborNodes, (neighborArray, fromId) => {
            _.forEach(neighborArray, id => {
                const { visibleBy = {}, visibleFrom = {} } = this.map.node(id);
                visibleBy[this.playerId] = true;
                visibleFrom[fromId] = true;
                this.map.setNode(id, {
                    visible : true,
                    visibleBy,
                    visibleFrom
                });
            });
        });
    }





    /**************************************************************************\
    Getters
    \**************************************************************************/

    get homeNode() {
        return this._homeNode||(this._homeNode = this.claimRandomNode({owner : this.playerId, home : true}));
    }

    get claimedRegions() {
        let nodes = [];
        let edges = [];
        _.forEach(this.map.nodes(), node => {
            const { owner } = this.map.node(node);
            if (owner !== this.playerId) { return; }
            const regionGraph = this.addRegion(node, "#FFFFFF", "region");
            nodes = _.concat(nodes, regionGraph.nodes);
            edges = _.concat(edges, regionGraph.edges);
        });

        return {
            nodes, edges
        };
    }

    get unclaimedNeighborsGraph() {
        let nodes = [];
        let edges = [];

        _.forEach(this.map.nodes(), id => {
            const { visibleBy = {}, visibleFrom = {}, owner, point } = this.map.node(id);
            if (!visibleBy[this.playerId]) {
                // nodes.push({
                //     id      : `${id}_unknown_node`,
                //     x       : point.x,
                //     y       : point.y,
                //     fixed   : true,
                //     physics : false,
                //     shape   : "dot",
                //     size    : 2,
                //     color   : "#333333"
                // });
                return;
            }
            if (owner === this.playerId) { return; }

            nodes.push({
                id      : `${id}_unclaimed_neighbor`,
                label   : `${id}_unclaimed_neighbor`,
                x       : point.x,
                y       : point.y,
                fixed   : true,
                physics : false,
                shape   : "dot",
                size    : 3,
                color   : "#333333"
            });

            _.forEach(_.keys(visibleFrom), fromId => {
                edges.push({
                    id     : `${fromId}_${id}_neighbor`,
                    from   : `${fromId}`,
                    to     : `${id}_unclaimed_neighbor`,
                    width  : 0.5,
                    arrows : '',
                    color  : {
                        color : "#333333"
                    }
                });
            });
        });

        return {
            nodes, edges
        };
    }

    get unclaimedNeighborRegions() {
        let nodes = [];
        let edges = [];

        _.forEach(this.map.nodes(), id => {
            const { visibleBy = {} } = this.map.node(id);
            if (!visibleBy[this.playerId]) { return; }
            const regionGraph = this.addRegion(id, "#333333", "neighbor_region");
            nodes = _.concat(nodes, regionGraph.nodes);
            edges = _.concat(edges, regionGraph.edges);
        });

        return {
            nodes, edges
        };
    }

    get unclaimedNeighborNodes() {
        const neighbors = {};
        // Find all claimed nodes
        _.forEach(this.map.nodes(), node => {
            const nodeInfo = this.map.node(node);
            if (!nodeInfo.claimed) { return; }
            if (nodeInfo.owner !== this.playerId) { return; }

            // Find all adjacent nodes to claimed nodes
            _.forEach(this.map.graph.neighbors(node), nNode => {
                const neighborNodeInfo = this.map.node(nNode);
                if (neighborNodeInfo.claimed) { return; }

                neighbors[node] = (neighbors[node]||[]);
                neighbors[node].push(nNode);
            });
        });

        return neighbors;
    }

    get map() {
        return this._map || (this._map = new Map());
    }

    get network() {
        return this._network;
    }

    get visualNodes() {
        this._setUnclaimedNeighborsAsVisible();
        const edgeDict = {};
        const nodes = [];
        const edges = [];

        // const starTypes = [
        //     {
        //         chance : [0, 0.0000003],
        //         color  : '#92B5FF',
        //         radius : 6.6
        //     },{
        //         chance : [0.0000003, 0.0013],
        //         color  : '#A2C0FF',
        //         radius : 1.8
        //     },{
        //         chance : [0.0013, 0.006],
        //         color  : '#D5E0FF',
        //         radius : 1.4
        //     },{
        //         chance : [0.006, 0.03],
        //         color  : '#F9F5FF',
        //         radius : 1.15
        //     },{
        //         chance : [0.03, 0.076],
        //         color  : '#FFEDE3',
        //         radius : 0.96
        //     },{
        //         chance : [0.076, 0.121],
        //         color  : '#FFDAB5',
        //         radius : 0.7
        //     },{
        //         chance : [0.121, 0.7645],
        //         color  : '#FFB56C',
        //         radius : 0.7
        //     }
        // ];

        _.forEach(this.map.nodes(), node => {
            if (node === "undefined") { return; }
            const { claimed, visible, point } = this.map.node(node);
            if (claimed === false && visible === false) { return; }
            const nodeEdgeInfo = this.map.nodeEdges(node);
            // const starType = _.random(0,13);
            nodes.push({
                id      : `${node}`,
                label   : `${node}`,
                x       : point.x,
                y       : point.y,
                fixed   : true,
                physics : false,
                shape   : "dot",
                size    : 3,//([1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 3, 3, 3, 4.5])[starType],
                color   : '#FFFFFF'//(["#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FF9999", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#ADD8E6"])[starType]
            });

            _.forEach(nodeEdgeInfo, edge => {
                const edgeId = `${edge.v}_${edge.w}`;
                if (edgeDict[edgeId] === true) { return; }
                const { owner : fromOwner } = this.map.node(edge.w);
                if (fromOwner !== this.playerId) { return; }
                const { owner : toOwner } = this.map.node(edge.v);
                if (toOwner !== this.playerId) { return; }
                edgeDict[edgeId] = true;
                edges.push({
                    id     : edgeId,
                    from   : edge.v,
                    to     : edge.w,
                    width  : 1,
                    arrows : '',
                    color  : {
                        color : "#007700"
                    }
                });
            });
        });

        return {
            nodes,
            edges
        };
    }

    get ownedNodeCount() {
        return this.ownedNodes.length;
    }

    get ownedNodes() {
        return _.filter(this.map.nodes(), id => {
            return this.map.node(id).owner === this.playerId;
        });
    }




    /**************************************************************************\
    Setters
    \**************************************************************************/
    set network(network) {
        this._network = network;
    }

    set homeNode(homeNode) {
        return this._homeNode = homeNode;
    }
}

export default BaseGame;
