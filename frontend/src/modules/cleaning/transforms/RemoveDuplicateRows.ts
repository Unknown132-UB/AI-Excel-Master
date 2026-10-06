export default class RemoveDuplicateRows {

    execute(rows: any[][]): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const unique = new Set<string>();
        const result: any[][] = [];

        for (const row of rows) {

            const key = JSON.stringify(row);

            if (!unique.has(key)) {
                unique.add(key);
                result.push(row);
            }

        }

        return result;

    }

}