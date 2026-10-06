import type { DatasetReport } from "./DataAnalyzer";



export interface CleaningSuggestion {


    issue:string;

    count:number;

    action:string;


}



export default class CleaningAdvisor {



    generate(
        report:DatasetReport
    ):CleaningSuggestion[] {



        const suggestions:
            CleaningSuggestion[] = [];




        // Duplicate rows

        if(
            report.duplicateRows > 0
        ){

            suggestions.push({

                issue:
                "Duplicate rows detected",


                count:
                report.duplicateRows,


                action:
                "Remove duplicate rows"

            });

        }





        // Empty cells

        if(
            report.emptyCells > 0
        ){

            suggestions.push({

                issue:
                "Empty cells detected",


                count:
                report.emptyCells,


                action:
                "Fill missing values"

            });

        }





        // Empty dataset

        if(
            report.rows === 0
        ){

            suggestions.push({

                issue:
                "No data found",


                count:0,


                action:
                "Upload a valid dataset"

            });

        }




        return suggestions;


    }




    createSummary(
        suggestions:CleaningSuggestion[]
    ):string {



        if(
            suggestions.length === 0
        ){

            return "Dataset looks clean.";

        }



        let message =
            "AI Cleaning Suggestions:\n\n";



        suggestions.forEach(
            item=>{


                message +=

                `✓ ${item.issue}: ${item.count}\n` +

                `  Action: ${item.action}\n\n`;


            }

        );



        return message;


    }



}