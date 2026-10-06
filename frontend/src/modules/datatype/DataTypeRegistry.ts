import DataTypeEngine from "./DataTypeEngine";


class DataTypeRegistry {

    private static engine: DataTypeEngine;


    static getEngine():
        DataTypeEngine {

        if (!this.engine) {
            this.engine = new DataTypeEngine();
        }

        return this.engine;
    }

}

export default DataTypeRegistry;