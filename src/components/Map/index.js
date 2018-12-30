import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from "react-redux";
import Graph from 'react-graph-vis';
import _ from 'lodash';
import ScrollArea from 'react-scrollbar';

import { Panel, LockedPanel } from '../UI';

import Game from '../../lib/Game';

import './index.scss';
import 'react-scrollbar/dist/css/scrollArea.css';

class Map extends Component {
    constructor(props) {
        super(props);

        this.graph = {
            nodes : [],
            edges : []
        };

        this.state = {
            panelVisible : false,
            panelData    : null,
            events       : {
                select : (event) => {
                    let { nodes } = event;
                    if (nodes.length < 1) {
                        this.setState({
                            panelVisible : false,
                            panelData    : null
                        });
                        return;
                    }
                    const node = nodes[0].split("_")[0];
                    this.setState({
                        panelVisible : true,
                        panelData    : Game.map.node(node)
                    });
                    // console.log(event);
                    // // console.log(nodes[0], Game.map.node(nodes[0]));
                    // Game.map.voronoi.renderCell(nodes[0], this.context);
                },
                beforeDrawing : (ctx) => {
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0-1500, 0-1500, Game.map.size+3000, Game.map.size+3000);
                }
            },
            graph   : {...this.graph},
            options : {
                autoResize : true,
                layout     : {},
                edges      : {
                    color      : "#000000",
                    hoverWidth : width => width,
                    chosen     : false
                },
                nodes : {
                    font : {
                        size : 0
                    },
                    chosen : {
                        node : async (values, id, selected) => {
                            if (selected !== true) { return; }
                            // console.log(values, id, selected);
                            values.borderColor = `rgba(${this.hexToRgb("#0F0").join(",")},0.5)`;
                            values.borderWidth = 3;
                            // values.color = `rgba(${this.hexToRgb(values.color).join(",")},1)`;
                            // values.size = 3;

                            if (_.endsWith(id, "_unclaimed_neighbor")) {
                                const claimedId = id.split("_")[0];
                                // console.log("clicked on unclaimed_neighbor", claimedId, Game.playerId);
                                Game.claimNode(claimedId, {owner : Game.playerId});
                                this.setVisualGraph();
                            }
                        }
                    }
                }
            }
        };

        // console.log("Game", Game);

        this.setVisualGraph = this.setVisualGraph.bind(this);
    }

    hexToRgb(hex) {
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length === 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return [(c>>16)&255, (c>>8)&255, c&255];
        }
        throw new Error('Bad Hex');
    }

    componentDidUpdate(prevProps) {
        // if (prevProps.toggleNode !== this.props.toggleNode) {
        //     console.log(this.props.toggleNode);
        //     const firstNodeId = Game.map.nodes()[0];
        //     Game.map.setNode(firstNodeId, {visible : this.props.toggleNode});
        //     console.log(Game.map.node(firstNodeId));
        //     this.setVisualGraph();
        // }

        if (prevProps.showHome !== this.props.showHome) {
            Game.goToNode(Game.homeNode);
        }
    }

    componentDidMount() {
        Game.goToNode(Game.homeNode);
        this.setVisualGraph();
    }

    setVisualGraph() {
        let { nodes, edges } = Game.visualNodes;

        const regionGraph = Game.claimedRegions;
        const unclaimedNeighborGraph = Game.unclaimedNeighborsGraph;
        const unclaimedNeighborRegionGraph = Game.unclaimedNeighborRegions;

        let nodeList = [];
        nodeList = _.concat(nodeList, nodes);
        nodeList = _.concat(nodeList, unclaimedNeighborRegionGraph.nodes);
        nodeList = _.concat(nodeList, unclaimedNeighborGraph.nodes);
        nodeList = _.concat(nodeList, regionGraph.nodes);

        let edgeList = [];
        edgeList = _.concat(edgeList, edges);
        edgeList = _.concat(edgeList, unclaimedNeighborRegionGraph.edges);
        edgeList = _.concat(edgeList, unclaimedNeighborGraph.edges);
        edgeList = _.concat(edgeList, regionGraph.edges);

        this.setState({
            graph : {
                nodes : nodeList,
                edges : edgeList
            }
        });
    }

    render() {
        return (
            <div className="Map">
                <Graph
                    style={{
                        height   : "100%",
                        width    : "100%",
                        position : "absolute",
                        top      : 0,
                        right    : 0,
                        bottom   : 0,
                        left     : 0
                    }}
                    graph={this.state.graph}
                    options={this.state.options}
                    events={this.state.events}
                    getNetwork={(networkInstance) => {
                        Game.network = networkInstance;
                    }}
                />
                <LockedPanel
                    bounds=".Map"
                >
                    <div className="row between-xs">
                        <div className="col-xs-6"><button className="ui-button square" onClick={() => {
                            Game.goToNode(Game.homeNode);
                        }}><i className="far fa-globe" /></button></div>
                        <div className="col-xs-6"><button className="ui-button square" onClick={() => {
                            this.setState({
                                panelVisible : !this.state.panelVisible
                            });
                        }}><i className="fas fa-omega" /></button></div>
                    </div>
                </LockedPanel>
                <Panel
                    visible={this.state.panelVisible}
                    onClose={() => {
                        this.setState({
                            panelVisible : false
                        });
                    }}
                    panelTitle="Info"
                    bounds=".Map"
                    defaultPosition={{ x : 0, y : 80}}
                    enableResizing={{
                        bottom      : true,
                        bottomLeft  : false,
                        bottomRight : false,
                        left        : false,
                        right       : false,
                        top         : true,
                        topLeft     : false,
                        topRight    : false
                    }}
                >
                    <div className="game-ui-content-area">
                        <div className="row">
                            <div className="col-xs-5">Home Node:</div>
                            <div className="col-xs-7">
                                <a href="/" onClick={(e) => {
                                    e.preventDefault();
                                    Game.goToNode(Game.homeNode);
                                }}><i className="far fa-bullseye" /> #{Game.homeNode}</a>
                            </div>
                            <div className="col-xs-5">Nodes owned:</div>
                            <div className="col-xs-7">{Game.ownedNodeCount}</div>
                        </div>
                    </div>
                    <div className="game-ui-content-area">-------- Owned Nodes --------</div>
                    <ScrollArea
                        speed={0.8}
                        className="game-ui-content-area flex-grow"
                        contentClassName="row"
                        horizontal={false}
                        smoothScrolling={true}
                    >
                        <div className="row">
                            {_.map(Game.ownedNodes, id => {
                                return [
                                    <div className="col-xs-5" key={`owned_node_label_${id}`}>Node: <a href="/" onClick={(e) => {
                                        e.preventDefault();
                                        Game.goToNode(id);
                                    }}><i className="far fa-bullseye" /> #{id}</a></div>,
                                    <div className="col-xs-7" key={`owned_node__coords_${id}`}>Location: {Math.round(Game.map.node(id).point.x)}|{Math.round(Game.map.node(id).point.y)}</div>
                                ];
                            })}
                        </div>
                    </ScrollArea>
                </Panel>
            </div>
        );
    }
}

Map.propTypes = {
    toggleNode : PropTypes.bool,
    showHome   : PropTypes.number
};

const mapStateToProps = state => ({
    state
});

const mapDispatchToProps = dispatch =>
    bindActionCreators({

    }, dispatch);

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Map);
