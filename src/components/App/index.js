import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from "react-redux";

import Map from '../Map';

import { setText } from '../../actions/app';

import './index.scss';

class App extends Component {
    constructor(props) {
        super(props);

        this.text = "Reat+Redux Boilerplate";

        this.state = {
            node     : true,
            showHome : Date.now()
        };
    }

    componentWillMount() {
        this.props.setText(this.text);
    }

    render() {
        return (
            <div className="App">
                {/* <div className="controls">
                    <button>Generate new map</button>
                    <button onClick={() => {
                        this.setState({node : !this.state.node});
                    }}>Toggle Node</button>
                    <button onClick={() => {
                        this.setState({showHome : Date.now()});
                    }}>Go Home</button>
                </div> */}
                <Map
                    toggleNode={this.state.node}
                    showHome={this.state.showHome}
                />
            </div>
        );
    }
}

App.propTypes = {
    text    : PropTypes.string.isRequired,
    setText : PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    text : state.app.text
});

const mapDispatchToProps = dispatch =>
    bindActionCreators({
        setText
    }, dispatch);

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);
