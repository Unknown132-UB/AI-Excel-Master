import ExportEngine from "./ExportEngine";



class ExportRegistry {

    private static engine: ExportEngine;


    static getEngine():
        ExportEngine {

        if (!this.engine) {
            this.engine = new ExportEngine();
        }

        return this.engine;
    }

}

export default ExportRegistry;