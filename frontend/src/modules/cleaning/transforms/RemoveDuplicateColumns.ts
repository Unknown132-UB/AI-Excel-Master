export default class RemoveDuplicateColumns {

    execute(rows: any[][]): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const columnCount = rows[0].length;
        const duplicateColumns = new Set<number>();

        for (let i = 0; i < columnCount; i++) {

            if (duplicateColumns.has(i)) {
                continue;
            }

            for (let j = i + 1; j < columnCount; j++) {

                let identical = true;

                for (const row of rows) {

                    if (row[i] !== row[j]) {
                        identical = false;
                        break;
                    }

                }

                if (identical) {
                    duplicateColumns.add(j);
                }

            }

        }

        return rows.map(row =>
            row.filter((_, index) => !duplicateColumns.has(index))
        );

    }

}