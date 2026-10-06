export default class RemoveEmptyColumns {

    execute(rows: any[][]): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const columnCount = rows[0].length;
        const emptyColumns = new Set<number>();

        for (let col = 0; col < columnCount; col++) {

            let isEmpty = true;

            for (const row of rows) {

                const value = row[col];

                if (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                ) {
                    isEmpty = false;
                    break;
                }

            }

            if (isEmpty) {
                emptyColumns.add(col);
            }

        }

        return rows.map(row =>
            row.filter((_, index) => !emptyColumns.has(index))
        );

    }

}