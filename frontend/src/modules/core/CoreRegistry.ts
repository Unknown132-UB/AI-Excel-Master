import ExcelMasterEngine from "./ExcelMasterEngine";


class CoreRegistry {


    private engine: ExcelMasterEngine;



    constructor(){

        this.engine =
            new ExcelMasterEngine();

    }



    getEngine(){

        return this.engine;

    }


}



export default new CoreRegistry();