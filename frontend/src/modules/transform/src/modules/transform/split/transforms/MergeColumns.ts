export interface MergeColumnsOptions {
    separator?: string;
    ignoreEmpty?: boolean;
    trimValues?: boolean;
}

export default class MergeColumns {

    execute(
        rows: string[][],
        columns: number[],
        options: MergeColumnsOptions = {}
    ) {

        const separator = options.separator ?? " ";
        const ignoreEmpty = options.ignoreEmpty ?? true;
        const trimValues = options.trimValues ?? true;

        return rows.map(row => {

            const values = columns
                .map(index => {

                    let value = row[index] ?? "";

                    if (trimValues) {
                        value = value.trim();
                    }

                    return value;

                })
                .filter(value =>
                    ignoreEmpty ? value !== "" : true
                );

            return values.join(separator);

        });

    }

    mergeIntoColumn(
        rows: string[][],
        columns: number[],
        targetColumn: number,
        options: MergeColumnsOptions = {}
    ) {

        const merged = this.execute(rows, columns, options);

        return rows.map((row, index) => {

            const newRow = [...row];

            newRow[targetColumn] = merged[index];

            return newRow;

        });

    }

}