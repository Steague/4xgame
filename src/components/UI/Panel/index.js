import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from "react-redux";
// import _ from 'lodash';
import cx from 'classnames';
import { Rnd } from 'react-rnd';

class Panel extends Component {
    constructor(props) {
        super(props);

        const { visible, defaultPosition, ...passedProps } = props;
        delete passedProps.panelTitle;
        delete passedProps.contentType;
        this.passedProps = passedProps;

        this.state = {
            width  : 320,
            height : 200,

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
                maxWidth={640}
                minWidth={320}
                maxHeight={400}
                minHeight={200}
                size={{
                    width  : this.state.width,
                    height : this.state.height
                }}
                onDragStop={(e, d) => {this.setState({ x : d.x, y : d.y });}}
                onResize={(e, direction, ref, delta, position) => {
                    this.setState({
                        width  : ref.offsetWidth,
                        height : ref.offsetHeight,
                        ...position
                    });
                    window.dispatchEvent(new Event('resize'));
                }}
                dragHandleClassName="handle"
                {...this.passedProps}
            >
                <h3 className="row between-xs">
                    <div className="col-xs-10">
                        {this.props.panelTitle}
                    </div>
                    <div className="col-xs-2 ui-icons">
                        <i className="handle far fa-arrows" />
                        <a href="/" onClick={(e) => {
                            e.preventDefault();
                            if (this.props.onClose !== undefined) {
                                this.props.onClose.call();
                            }
                        }}><i className="far fa-times-square" /></a>
                    </div>
                </h3>
                <div className={cx("panel-content",{
                    vertical   : this.props.contentType === "vertical" || !this.props.contentType,
                    horizontal : this.props.contentType === "horizontal"
                })}>
                    {this.props.children}
                </div>
            </Rnd>
        );
    }
}

Panel.propTypes = {
    children   : PropTypes.any,
    panelTitle : PropTypes.string,
    onClose    : PropTypes.func
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
)(Panel);
