import { SET_TEXT } from '../actions/app';

const initialState = {
    text : ''
};

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_TEXT: {
            return {
                ...state,
                text : action.payload
            };
        }
        default: {
            return state;
        }
    }
};
