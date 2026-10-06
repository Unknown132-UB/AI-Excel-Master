import ImportEngine from "./ImportEngine";


class ImportRegistry {


    private static engine:
        ImportEngine;



    static getEngine():

        ImportEngine {


        if (!this.engine) {


            this.engine =
                new ImportEngine();


        }


        return this.engine;


    }



}


export default ImportRegistry;