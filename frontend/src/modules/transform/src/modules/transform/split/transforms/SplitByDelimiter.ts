import AutoDelimiterDetector from "../detectors/AutoDelimiterDetector";
import SplitEngine from "../SplitEngine";

export interface SplitByDelimiterResult {
    delimiter: string;
    headers: string[];
    rows: string[][];
}

export default class SplitByDelimiter {

    private detector: AutoDelimiterDetector;
    private engine: SplitEngine;

    constructor() {
        this.detector = new AutoDelimiterDetector();
        this.engine = new SplitEngine();
    }

    execute(lines: string[]): SplitByDelimiterResult {

        if (!lines || lines.length === 0) {
            return {
                delimiter: "",
                headers: [],
                rows: []
            };
        }

        const detected = this.detector.detect(lines);

        const result = this.engine.split(
            lines,
            detected.delimiter
        );

        return {
            delimiter: detected.delimiter,
            headers: result.headers,
            rows: result.rows
        };
    }

    executeWithDelimiter(
        lines: string[],
        delimiter: string
    ): SplitByDelimiterResult {

        const result = this.engine.split(
            lines,
            delimiter
        );

        return {
            delimiter,
            headers: result.headers,
            rows: result.rows
        };
    }
}