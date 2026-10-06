export default class RemoveEmptyRows {

    execute(rows: any[][]): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.filter(row => {

            if (!row) {
                return false;
            }

            return row.some(cell => {

                if (cell === null || cell === undefined) {
                    return false;
                }

                if (typeof cell === "string") {
                    return cell.trim() !== "";
                }

                return true;

            });

        });

    }

}