export interface ConvertToNumberOptions {

    removeCurrencySymbols?: boolean;

    removeCommas?: boolean;

    convertPercentage?: boolean;

    supportThousands?: boolean;

}


export default class ConvertToNumber {


    execute(
        rows: any[][],
        options: ConvertToNumberOptions = {}
    ): any[][] {


        if (!rows || rows.length === 0) {
            return [];
        }


        const {
            removeCurrencySymbols = true,
            removeCommas = true,
            convertPercentage = true,
            supportThousands = true
        } = options;



        return rows.map(row =>

            row.map(cell => {


                if (
                    cell === null ||
                    cell === undefined ||
                    cell === ""
                ) {
                    return cell;
                }


                if (typeof cell === "number") {
                    return cell;
                }



                if (typeof cell !== "string") {
                    return cell;
                }



                let value = cell.trim();



                // Remove currency symbols
                if (removeCurrencySymbols) {

                    value = value.replace(
                        /[$₹€£¥]/g,
                        ""
                    );

                }



                // Remove commas
                if (removeCommas) {

                    value = value.replace(
                        /,/g,
                        ""
                    );

                }



                // Convert percentage
                if (
                    convertPercentage &&
                    value.endsWith("%")
                ) {

                    value =
                        value.replace("%", "");

                    const number =
                        Number(value);

                    return isNaN(number)
                        ? cell
                        : number / 100;

                }



                // Support K, M, B
                if (supportThousands) {

                    const suffix =
                        value.slice(-1).toLowerCase();


                    const number =
                        Number(value.slice(0, -1));


                    if (!isNaN(number)) {


                        if (suffix === "k") {
                            return number * 1000;
                        }


                        if (suffix === "m") {
                            return number * 1000000;
                        }


                        if (suffix === "b") {
                            return number * 1000000000;
                        }

                    }

                }



                const result =
                    Number(value);



                return isNaN(result)
                    ? cell
                    : result;



            })

        );


    }


}