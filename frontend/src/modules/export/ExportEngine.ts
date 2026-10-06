import ExcelWriter from "./writers/ExcelWriter";
import CSVWriter from "./writers/CSVWriter";
import JSONWriter from "./writers/JSONWriter";



export type ExportFormat =
    "excel"
    | "csv"
    | "json";




export default class ExportEngine {



    private excelWriter: ExcelWriter;

    private csvWriter: CSVWriter;

    private jsonWriter: JSONWriter;




    constructor(){


        this.excelWriter =
            new ExcelWriter();


        this.csvWriter =
            new CSVWriter();


        this.jsonWriter =
            new JSONWriter();


    }





    export(

        data:any[][],

        format:ExportFormat,

        fileName?:string

    ){



        switch(format){



            case "excel":


                return this.excelWriter.write(

                    data,

                    fileName ||
                    "cleaned_data.xlsx"

                );





            case "csv":


                return this.csvWriter.write(

                    data,

                    fileName ||
                    "cleaned_data.csv"

                );





            case "json":


                return this.jsonWriter.write(

                    data,

                    fileName ||
                    "cleaned_data.json"

                );





            default:


                return {


                    success:false,


                    message:
                    "Unsupported export format"


                };


        }


    }



}