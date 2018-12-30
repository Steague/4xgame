import BaseGame from './BaseGame';

class Game extends BaseGame {
    static instance;

    constructor() {
        super();
        if (Game.instance) {
            return Game.instance;
        }

        this.instance = this;
    }
}

export default new Game();
