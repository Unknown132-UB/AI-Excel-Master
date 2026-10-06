import CleaningRegistry from "../cleaning/CleaningRegistry";
import DataTypeRegistry from "../datatype/DataTypeRegistry";
import AIRegistry from "../ai/AIRegistry";


interface PipelineOptions {


    analyze?: boolean;


    cleaning?: {

        name: string;

        options?: any;

    }[];


}



export default class DataPipeline {



    private cleaningEngine;

    private datatypeEngine;

    private aiEngine;




    constructor(){


        this.cleaningEngine =
            CleaningRegistry.getEngine();



        this.datatypeEngine =
            DataTypeRegistry.getEngine();



        this.aiEngine =
            AIRegistry.getEngine();


    }





    async execute(

        data:any[][],

        options:PipelineOptions = {}

    ){



        let result =
            data;



        let analysis:any = null;




        /*
            1. Detect Data Types
        */


        const headers =
            result[0];


        const rows =
            result.slice(1);



        const datatypeReport =
            this.datatypeEngine.detectTable(

                headers,

                rows

            );





        /*
            2. AI Analysis
        */


        if(
            options.analyze
        ){


            analysis =
            await this.aiEngine.analyze({

                task:
                "Analyze dataset quality",

                data:{

                    datatypeReport,

                    rows:
                    result.length,

                    columns:
                    headers.length

                }


            });


        }






        /*
            3. Cleaning
        */


        if(
            options.cleaning
        ){


            for(
                const clean of options.cleaning
            ){


                const output =
                this.cleaningEngine.execute(

                    clean.name,

                    result,

                    clean.options

                );



                if(
                    output.success
                ){

                    result =
                    output.data;

                }


            }


        }





        return {


            success:true,


            data:result,


            datatypeReport,


            aiAnalysis:analysis


        };


    }



}