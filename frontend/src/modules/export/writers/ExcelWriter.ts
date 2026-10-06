import * as XLSX from "xlsx";


export default class ExcelWriter {


    write(

        data: any[][],

        fileName: string = "cleaned_data.xlsx"

    ) {


        if (
            !data ||
            data.length === 0
        ) {

            return {

                success: false,

                message: "No data available"

            };

        }



        // Convert array data into Excel sheet

        const worksheet =

            XLSX.utils.aoa_to_sheet(
                data
            );



        // Create workbook

        const workbook =

            XLSX.utils.book_new();



        // Add sheet

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            "Sheet1"

        );



        // Download Excel file

        XLSX.writeFile(

            workbook,

            fileName

        );



        return {

            success: true,

            fileName

        };


    }


}