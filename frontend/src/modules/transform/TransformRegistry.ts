import TransformEngine from "./engine/TransformEngine";

// Text Transforms
import UpperCaseTransform from "./transforms/text/UpperCaseTransform";
import LowerCaseTransform from "./transforms/text/LowerCaseTransform";
import ProperCaseTransform from "./transforms/text/ProperCaseTransform";

// Date Transforms
import DateFormatTransform from "./transforms/date/DateFormatTransform";
import TimeFormatTransform from "./transforms/date/TimeFormatTransform";

// Number Transforms
import CurrencyTransform from "./transforms/number/CurrencyTransform";
import PercentageTransform from "./transforms/number/PercentageTransform";


class TransformRegistry {

    private static engine: TransformEngine;


    static getEngine(): TransformEngine {

        if (!this.engine) {

            this.engine = new TransformEngine();

            this.registerAll();

        }

        return this.engine;
    }


    private static registerAll() {

        // Text
        this.engine.register(new UpperCaseTransform());
        this.engine.register(new LowerCaseTransform());
        this.engine.register(new ProperCaseTransform());

        // Date
        this.engine.register(new DateFormatTransform());
        this.engine.register(new TimeFormatTransform());

        // Number
        this.engine.register(new CurrencyTransform());
        this.engine.register(new PercentageTransform());

    }

}

export default TransformRegistry;