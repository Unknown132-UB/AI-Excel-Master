export interface FillEmptyCellsOptions {

    value?: any;

    method?:
        | "value"
        | "zero"
        | "na"
        | "previous"
        | "next";

}

export default class FillEmptyCells {

    execute(
        rows: any[][],
        options: FillEmptyCellsOptions = {}
    ): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const method = options.method ?? "value";

        const result = rows.map(row => [...row]);

        switch (method) {

            case "zero":

                return result.map(row =>
                    row.map(cell =>
                        this.isEmpty(cell) ? 0 : cell
                    )
                );

            case "na":

                return result.map(row =>
                    row.map(cell =>
                        this.isEmpty(cell) ? "N/A" : cell
                    )
                );

            case "value":

                return result.map(row =>
                    row.map(cell =>
                        this.isEmpty(cell)
                            ? (options.value ?? "")
                            : cell
                    )
                );

            case "previous":

                for (let col = 0; col < result[0].length; col++) {

                    let previous: any = "";

                    for (let row = 0; row < result.length; row++) {

                        if (this.isEmpty(result[row][col])) {

                            result[row][col] = previous;

                        } else {

                            previous = result[row][col];

                        }

                    }

                }

                return result;

            case "next":

                for (let col = 0; col < result[0].length; col++) {

                    let next: any = "";

                    for (let row = result.length - 1; row >= 0; row--) {

                        if (this.isEmpty(result[row][col])) {

                            result[row][col] = next;

                        } else {

                            next = result[row][col];

                        }

                    }

                }

                return result;

            default:

                return result;

        }

    }

    private isEmpty(value: any): boolean {

        return (
            value === null ||
            value === undefined ||
            value === ""
        );

    }

}