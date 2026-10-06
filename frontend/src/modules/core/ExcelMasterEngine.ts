import ImportRegistry from "../import/ImportRegistry";
import DataTypeRegistry from "../datatype/DataTypeRegistry";
import AIRegistry from "../ai/AIRegistry";
import CleaningRegistry from "../cleaning/CleaningRegistry";
import TransformRegistry from "../transform/TransformRegistry";
import ExportRegistry from "../export/ExportRegistry";


export interface ProcessOptions {

    analyze?: boolean;


    cleaning?: {

        name: string;

        options?: any;

    }[];


    transforms?: {

        name: string;

        options?: any;

    }[];

}




export default class ExcelMasterEngine {


    private importer: any;

    private datatype: any;

    private ai: any;

    private cleaning: any;

    private transform: any;

    private exporter: any;



    constructor(){


        this.importer =
            ImportRegistry.getEngine();



        this.datatype =
            DataTypeRegistry.getEngine();



        this.ai =
            AIRegistry.getEngine();



        this.cleaning =
            CleaningRegistry.getEngine();



        // IMPORTANT
        this.transform =
            TransformRegistry.getEngine();



        this.exporter =
            ExportRegistry.getEngine();


    }






    async processFile(

        file: File,

        options: ProcessOptions = {}

    ){



        // IMPORT

        let data: any[][] =
            await this.importer.import(file);




        // DATATYPE ANALYSIS

        const headers =
            data[0];


        const rows =
            data.slice(1);



        const datatypeReport =
            this.datatype.detectTable(

                headers,

                rows

            );






        // AI ANALYSIS

        let aiReport = null;



        if(options.analyze){


            aiReport =
            await this.ai.analyze({

                task:
                "Analyze Excel dataset",


                data:{

                    datatypeReport,

                    rows:data.length,

                    columns:headers.length

                }

            });


        }






        // CLEANING

        if(options.cleaning){


            for(
                const operation of options.cleaning
            ){


                const result =
                this.cleaning.execute(

                    operation.name,

                    data,

                    operation.options

                );



                if(result.success){

                    data =
                    result.data;

                }


            }

        }






        // TRANSFORMATION

        if(options.transforms){


            for(
                const operation of options.transforms
            ){


                const result =
                this.transform.execute(

                    operation.name,

                    data,

                    operation.options

                );



                if(result.success){

                    data =
                    result.value;

                }


            }

        }






        return {


            success:true,


            data,


            datatypeReport,


            aiReport


        };


    }




    exportData(

        data:any[][],

        format:"excel"|"csv"|"json"

    ){


        return this.exporter.export(

            data,

            format

        );


    }



}