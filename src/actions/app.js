// Actions
export const SET_TEXT = 'App/SET_TEXT';

export const setText = payload => {
    return dispatch => {
        dispatch({
            type : SET_TEXT,
            payload
        });
    };
};
