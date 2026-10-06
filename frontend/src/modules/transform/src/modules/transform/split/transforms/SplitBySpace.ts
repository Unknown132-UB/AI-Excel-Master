import SplitEngine from "../SplitEngine";

export default class SplitBySpace {

    private engine: SplitEngine;

    constructor() {
        this.engine = new SplitEngine();
    }

    execute(lines: string[]) {

        if (!lines || lines.length === 0) {
            return {
                headers: [],
                rows: [],
                delimiter: " "
            };
        }

        // Remove extra spaces before splitting
        const cleanedLines = lines.map(line =>
            line
                .trim()
                .replace(/\s+/g, " ")
        );

        return this.engine.split(cleanedLines, " ");
    }

}