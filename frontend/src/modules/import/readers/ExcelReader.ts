import * as XLSX from "xlsx";


export interface ExcelReaderOptions {

    sheetName?: string;

    header?: boolean;

}



export default class ExcelReader {


    async read(
        file: File,
        options: ExcelReaderOptions = {}
    ): Promise<any[][]> {


        const {

            sheetName,

            header = true

        } = options;



        const buffer =
            await file.arrayBuffer();



        const workbook =
            XLSX.read(
                buffer,
                {
                    type: "array"
                }
            );



        let selectedSheet =
            sheetName;



        if (!selectedSheet) {

            selectedSheet =
                workbook.SheetNames[0];

        }



        const worksheet =
            workbook.Sheets[selectedSheet];



        if (!worksheet) {

            throw new Error(
                "Sheet not found"
            );

        }



        const data =
    XLSX.utils.sheet_to_json<any[]>(
        worksheet,
        {
            header: 1,
            defval: ""
        }
    );



        if (header) {

            return data as any[][];

        }



        return[
            ...data
        ];


    }




    getSheets(
        file: File
    ): Promise<string[]> {


        return file
            .arrayBuffer()
            .then(buffer => {


                const workbook =
                    XLSX.read(
                        buffer,
                        {
                            type:"array"
                        }
                    );


                return workbook.SheetNames;


            });


    }


}