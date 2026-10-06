export interface DelimiterResult {
    delimiter: string;
    name: string;
    count: number;
}

export default class AutoDelimiterDetector {

    private readonly delimiters = [
        { delimiter: "|", name: "Pipe" },
        { delimiter: ",", name: "Comma" },
        { delimiter: ";", name: "Semicolon" },
        { delimiter: ":", name: "Colon" },
        { delimiter: "\t", name: "Tab" },
        { delimiter: " ", name: "Space" }
    ];

    detect(lines: string[]): DelimiterResult {

        if (!lines || lines.length === 0) {
            return {
                delimiter: ",",
                name: "Comma",
                count: 0
            };
        }

        let best = this.delimiters[0];
        let bestCount = 0;

        for (const option of this.delimiters) {

            let total = 0;

            for (const line of lines) {

                if (!line) continue;

                const occurrences =
                    line.split(option.delimiter).length - 1;

                total += occurrences;
            }

            if (total > bestCount) {
                best = option;
                bestCount = total;
            }
        }

        return {
            delimiter: best.delimiter,
            name: best.name,
            count: bestCount
        };
    }

    detectFromLine(line: string): DelimiterResult {

        return this.detect([line]);
    }

    getSupportedDelimiters(): string[] {

        return this.delimiters.map(d => d.delimiter);

    }

    isSupported(delimiter: string): boolean {

        return this.delimiters.some(
            d => d.delimiter === delimiter
        );

    }
}