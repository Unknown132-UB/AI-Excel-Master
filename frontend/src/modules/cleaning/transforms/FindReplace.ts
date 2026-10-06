export interface FindReplaceOptions {
    find: string;
    replaceWith: string;
    matchCase?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
}

export default class FindReplace {

    execute(
        rows: any[][],
        options: FindReplaceOptions
    ): any[][] {

        if (!rows || rows.length === 0) {
            return [];
        }

        const {
            find,
            replaceWith,
            matchCase = false,
            wholeWord = false,
            useRegex = false
        } = options;

        return rows.map(row =>
            row.map(cell => {

                if (typeof cell !== "string") {
                    return cell;
                }

                if (useRegex) {

                    const flags = matchCase ? "g" : "gi";
                    const regex = new RegExp(find, flags);

                    return cell.replace(regex, replaceWith);

                }

                let pattern = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                if (wholeWord) {
                    pattern = `\\b${pattern}\\b`;
                }

                const flags = matchCase ? "g" : "gi";

                const regex = new RegExp(pattern, flags);

                return cell.replace(regex, replaceWith);

            })
        );

    }

}