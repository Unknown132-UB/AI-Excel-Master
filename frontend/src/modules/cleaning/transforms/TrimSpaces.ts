export default class TrimSpaces {

    execute(rows: any[][]): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.map(row =>

            row.map(cell => {

                if (cell === null || cell === undefined) {
                    return cell;
                }

                if (typeof cell === "string") {
                    return cell.trim();
                }

                return cell;

            })

        );

    }

}