export interface ConvertToBooleanOptions {

    trueValues?: string[];

    falseValues?: string[];

    output?: "boolean" | "number";

}


export default class ConvertToBoolean {


    execute(
        rows: any[][],
        options: ConvertToBooleanOptions = {}
    ): any[][] {


        if (!rows || rows.length === 0) {
            return [];
        }


        const {

            trueValues = [
                "true",
                "yes",
                "y",
                "1",
                "active",
                "enabled",
                "on"
            ],

            falseValues = [
                "false",
                "no",
                "n",
                "0",
                "inactive",
                "disabled",
                "off"
            ],

            output = "boolean"

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



                if (typeof cell === "boolean") {

                    return output === "number"
                        ? Number(cell)
                        : cell;

                }



                const value =
                    String(cell)
                        .trim()
                        .toLowerCase();



                if (trueValues.includes(value)) {

                    return output === "number"
                        ? 1
                        : true;

                }



                if (falseValues.includes(value)) {

                    return output === "number"
                        ? 0
                        : false;

                }



                return cell;



            })

        );


    }


}