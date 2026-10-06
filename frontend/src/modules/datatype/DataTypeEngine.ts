import DetectType from "./detectors/DetectType";
import type { DataType } from "./detectors/DetectType";



export interface ColumnDetectionResult {

    column: string;

    dataType: DataType;

    confidence: number;

}




export default class DataTypeEngine {


    private detector: DetectType;



    constructor() {

        this.detector =
            new DetectType();

    }




    detectColumn(

        columnName: string,

        values: any[]

    ): ColumnDetectionResult {



        const typeCount:
            Record<string, number> = {};



        let total = 0;



        for(const value of values){


            const type =
                this.detector.detect(
                    value
                );


            typeCount[type] =
                (typeCount[type] || 0) + 1;


            total++;


        }



        let detectedType:
            DataType = "mixed";



        let max = 0;



        for(const type in typeCount){


            if(
                typeCount[type] > max
            ){

                max =
                    typeCount[type];


                detectedType =
                    type as DataType;

            }


        }




        return {

            column: columnName,

            dataType: detectedType,

            confidence:
                total === 0
                    ? 0
                    : Math.round(
                        (max / total) * 100
                    )

        };


    }





    detectTable(

        headers: string[],

        rows: any[][]

    ): ColumnDetectionResult[] {



        const result:
            ColumnDetectionResult[] = [];



        headers.forEach(
            (header,index)=>{


                const columnValues =
                    rows.map(
                        row =>
                            row[index]
                    );



                result.push(

                    this.detectColumn(
                        header,
                        columnValues
                    )

                );


            }

        );



        return result;


    }


}