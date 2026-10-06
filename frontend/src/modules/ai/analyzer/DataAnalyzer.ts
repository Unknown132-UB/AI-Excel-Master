export interface DatasetReport {


    rows:number;

    columns:number;

    emptyCells:number;

    duplicateRows:number;

    columnInfo:any[];


}



export default class DataAnalyzer {



    analyze(
        data:any[][]
    ): DatasetReport {



        if(
            !data ||
            data.length === 0
        ){

            return {

                rows:0,

                columns:0,

                emptyCells:0,

                duplicateRows:0,

                columnInfo:[]

            };

        }



        const headers =
            data[0];



        const rows =
            data.slice(1);



        let emptyCells = 0;



        rows.forEach(row=>{


            row.forEach(cell=>{


                if(
                    cell === "" ||
                    cell === null ||
                    cell === undefined
                ){

                    emptyCells++;

                }


            });


        });



        const duplicateRows =
            this.countDuplicates(
                rows
            );



        const columnInfo =
            headers.map(
                (header,index)=>({

                    name:header,

                    index:index,

                    filled:

                    rows.filter(
                        row =>
                        row[index] !== ""
                    ).length

                })

            );



        return {


            rows:
                rows.length,


            columns:
                headers.length,


            emptyCells,


            duplicateRows,


            columnInfo


        };


    }





    private countDuplicates(
        rows:any[][]
    ):number {


        const seen =
            new Set();


        let count = 0;



        rows.forEach(row=>{


            const key =
                JSON.stringify(row);



            if(
                seen.has(key)
            ){

                count++;

            }

            else{


                seen.add(key);


            }


        });



        return count;


    }


}