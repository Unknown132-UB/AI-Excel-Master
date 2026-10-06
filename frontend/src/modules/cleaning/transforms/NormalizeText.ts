export interface NormalizeTextOptions {

    caseType?:
        | "none"
        | "uppercase"
        | "lowercase"
        | "proper";

    removeInvisibleCharacters?: boolean;

    normalizeQuotes?: boolean;

    normalizeDashes?: boolean;

    removeExtraSpaces?: boolean;

}


export default class NormalizeText {


    execute(
        rows: any[][],
        options: NormalizeTextOptions = {}
    ): any[][] {


        if (!rows || rows.length === 0) {
            return [];
        }


        const {
            caseType = "none",
            removeInvisibleCharacters = true,
            normalizeQuotes = true,
            normalizeDashes = true,
            removeExtraSpaces = true
        } = options;



        return rows.map(row =>

            row.map(cell => {


                if (typeof cell !== "string") {
                    return cell;
                }


                let text = cell;



                // Remove invisible Unicode characters
                if (removeInvisibleCharacters) {

                    text = text.replace(
                        /[\u0000-\u001F\u007F-\u009F]/g,
                        ""
                    );

                }



                // Normalize quotes
                if (normalizeQuotes) {

                    text = text
                        .replace(/[“”]/g, '"')
                        .replace(/[‘’]/g, "'");

                }



                // Normalize dashes
                if (normalizeDashes) {

                    text = text
                        .replace(/[–—]/g, "-");

                }



                // Remove extra spaces
                if (removeExtraSpaces) {

                    text = text
                        .trim()
                        .replace(/\s+/g, " ");

                }



                // Apply case conversion
                switch (caseType) {


                    case "uppercase":

                        text = text.toUpperCase();

                        break;



                    case "lowercase":

                        text = text.toLowerCase();

                        break;



                    case "proper":

                        text = text
                            .toLowerCase()
                            .replace(
                                /\b\w/g,
                                char => char.toUpperCase()
                            );

                        break;

                }



                return text;


            })

        );


    }


}