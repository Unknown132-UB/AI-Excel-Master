export interface FixedWidthOptions {
    widths: number[];
}

export default class SplitFixedWidth {

    execute(
        lines: string[],
        options: FixedWidthOptions
    ) {

        if (!lines || lines.length === 0) {
            return {
                headers: [],
                rows: [],
                delimiter: "Fixed Width"
            };
        }

        const rows = lines.map((line) => {

            const columns: string[] = [];

            let start = 0;

            for (const width of options.widths) {

                columns.push(
                    line.substring(start, start + width).trim()
                );

                start += width;

            }

            if (start < line.length) {
                columns.push(
                    line.substring(start).trim()
                );
            }

            return columns;

        });

        const headers =
            rows.length > 0
                ? rows[0].map((_, index) => `Column ${index + 1}`)
                : [];

        return {
            headers,
            rows,
            delimiter: "Fixed Width"
        };

    }

}