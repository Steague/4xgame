import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from "react-redux";
// import _ from 'lodash';
import cx from 'classnames';
import { Rnd } from 'react-rnd';

class LockedPanel extends Component {
    constructor(props) {
        super(props);

        const { visible, defaultPosition, ...rndProps } = props;
        this.passedProps = rndProps;

        this.state = {
            x : defaultPosition && defaultPosition.x ? defaultPosition.x : 0,
            y : defaultPosition && defaultPosition.y ? defaultPosition.y : 0,

            visible : visible !== undefined ? visible : true
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
            this.setState({
                visible : this.props.visible
            });
        }
    }

    render() {
        if (this.state.visible === false) { return null; }

        return (
            <Rnd
                className={cx(`game-ui crt ${this.props.className}`)}
                position={{ x : this.state.x, y : this.state.y }}
                onDragStop={(e, d) => {this.setState({ x : d.x, y : d.y });}}
                onResize={(e, direction, ref, delta, position) => {
                    this.setState({
                        ...position
                    });
                }}
                enableResizing={false}
                {...this.passedProps}
            >
                {this.props.children}
            </Rnd>
        );
    }
}

LockedPanel.propTypes = {
    children : PropTypes.any
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
)(LockedPanel);
