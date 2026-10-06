import AIEngine from "./AIEngine";


class AIRegistry {

    private static engine: AIEngine;


    static getEngine():
        AIEngine {

        if (!this.engine) {
            this.engine = new AIEngine();
        }

        return this.engine;
    }

}

export default AIRegistry;