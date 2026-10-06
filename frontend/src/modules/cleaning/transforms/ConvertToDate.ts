export interface ConvertToDateOptions {

    format?:
        | "DD/MM/YYYY"
        | "MM/DD/YYYY"
        | "YYYY-MM-DD"
        | "auto";

    output?:
        | "date"
        | "string";

}


export default class ConvertToDate {


    execute(
        rows: any[][],
        options: ConvertToDateOptions = {}
    ): any[][] {


        if (!rows || rows.length === 0) {
            return [];
        }


        const {
            format = "auto",
            output = "date"
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


                let date: Date | null = null;



                // Already Date object
                if (cell instanceof Date) {

                    date = cell;

                }



                // Excel serial date
                else if (
                    typeof cell === "number"
                ) {

                    date = new Date(
                        (cell - 25569) * 86400 * 1000
                    );

                }



                // String date
                else if (
                    typeof cell === "string"
                ) {

                    date = this.parseDate(
                        cell.trim(),
                        format
                    );

                }



                if (!date || isNaN(date.getTime())) {

                    return cell;

                }



                if (output === "string") {

                    return this.formatDate(date);

                }


                return date;



            })

        );


    }



    private parseDate(
        value: string,
        format: string
    ): Date | null {


        let day: number;
        let month: number;
        let year: number;



        if (format === "YYYY-MM-DD") {

            const parts = value.split("-");

            if (parts.length !== 3) {
                return null;
            }

            year = Number(parts[0]);
            month = Number(parts[1]);
            day = Number(parts[2]);

        }


        else if (
            format === "DD/MM/YYYY" ||
            format === "auto"
        ) {

            const parts = value.split("/");


            if (parts.length === 3) {

                day = Number(parts[0]);
                month = Number(parts[1]);
                year = Number(parts[2]);

            }

            else {

                return this.nativeParse(value);

            }

        }


        else if (format === "MM/DD/YYYY") {

            const parts = value.split("/");


            if (parts.length !== 3) {
                return null;
            }


            month = Number(parts[0]);
            day = Number(parts[1]);
            year = Number(parts[2]);

        }


        else {

            return this.nativeParse(value);

        }



        const result = new Date(
            year!,
            month! - 1,
            day!
        );


        return result;

    }



    private nativeParse(
        value: string
    ): Date | null {


        const date = new Date(value);


        return isNaN(date.getTime())
            ? null
            : date;

    }



    private formatDate(
        date: Date
    ): string {


        const day =
            String(date.getDate())
            .padStart(2, "0");


        const month =
            String(date.getMonth() + 1)
            .padStart(2, "0");


        const year =
            date.getFullYear();


        return `${day}/${month}/${year}`;

    }


}