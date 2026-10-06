import CleaningEngine from "./CleaningEngine";

// Row / Column
import RemoveDuplicateRows from "./transforms/RemoveDuplicateRows";
import RemoveDuplicateColumns from "./transforms/RemoveDuplicateColumns";
import RemoveEmptyRows from "./transforms/RemoveEmptyRows";
import RemoveEmptyColumns from "./transforms/RemoveEmptyColumns";

// Text Cleaning
import TrimSpaces from "./transforms/TrimSpaces";
import RemoveExtraSpaces from "./transforms/RemoveExtraSpaces";
import FindReplace from "./transforms/FindReplace";
import RemoveSpecialCharacters from "./transforms/RemoveSpecialCharacters";
import NormalizeText from "./transforms/NormalizeText";

// Missing Data
import FillEmptyCells from "./transforms/FillEmptyCells";

// Data Type Conversion
import ConvertToNumber from "./transforms/ConvertToNumber";
import ConvertToDate from "./transforms/ConvertToDate";
import ConvertToBoolean from "./transforms/ConvertToBoolean";


class CleaningRegistry {

    private static engine: CleaningEngine;


    static getEngine() {

        if (!this.engine) {

            this.engine = new CleaningEngine();

            this.registerAll();

        }

        return this.engine;

    }



    private static registerAll() {


        // Duplicate / Empty Data

        this.engine.register(
            "removeduplicaterows",
            new RemoveDuplicateRows()
        );


        this.engine.register(
            "removeduplicatecolumns",
            new RemoveDuplicateColumns()
        );


        this.engine.register(
            "removeemptyrows",
            new RemoveEmptyRows()
        );


        this.engine.register(
            "removeemptycolumns",
            new RemoveEmptyColumns()
        );



        // Text Cleaning


        this.engine.register(
            "trimspaces",
            new TrimSpaces()
        );


        this.engine.register(
            "removeextraspaces",
            new RemoveExtraSpaces()
        );


        this.engine.register(
            "findreplace",
            new FindReplace()
        );


        this.engine.register(
            "removespecialcharacters",
            new RemoveSpecialCharacters()
        );


        this.engine.register(
            "normalizetext",
            new NormalizeText()
        );



        // Missing Values


        this.engine.register(
            "fillemptycells",
            new FillEmptyCells()
        );



        // Data Conversion


        this.engine.register(
            "converttonumber",
            new ConvertToNumber()
        );


        this.engine.register(
            "converttodate",
            new ConvertToDate()
        );


        this.engine.register(
            "converttoboolean",
            new ConvertToBoolean()
        );

    }

}

export default CleaningRegistry;