export interface RemoveSpecialCharactersOptions {

    keepSpaces?: boolean;

    keepNumbers?: boolean;

    keepLetters?: boolean;

}

export default class RemoveSpecialCharacters {

    execute(
        rows: any[][],
        options: RemoveSpecialCharactersOptions = {}
    ): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const {
            keepSpaces = true,
            keepNumbers = true,
            keepLetters = true
        } = options;

        let pattern = "";

        if (keepLetters) pattern += "A-Za-z";
        if (keepNumbers) pattern += "0-9";
        if (keepSpaces) pattern += "\\s";

        const regex = new RegExp(`[^${pattern}]`, "g");

        return rows.map(row =>

            row.map(cell => {

                if (typeof cell !== "string") {
                    return cell;
                }

                return cell.replace(regex, "");

            })

        );

    }

}