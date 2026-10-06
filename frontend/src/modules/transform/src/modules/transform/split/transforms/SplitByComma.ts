import SplitEngine from "../SplitEngine";

export default class SplitByComma {

    private engine: SplitEngine;

    constructor() {
        this.engine = new SplitEngine();
    }

    execute(lines: string[]) {

        if (!lines || lines.length === 0) {
            return {
                headers: [],
                rows: [],
                delimiter: ","
            };
        }

        return this.engine.split(lines, ",");
    }

}