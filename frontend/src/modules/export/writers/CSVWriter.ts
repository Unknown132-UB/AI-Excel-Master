export default class CSVWriter {


    write(
        data:any[][],
        fileName:string = "cleaned_data.csv"
    ){


        const csv = data
            .map(row =>
                row.join(",")
            )
            .join("\n");



        const blob =
            new Blob(
                [csv],
                {
                    type:"text/csv"
                }
            );



        const url =
            URL.createObjectURL(blob);



        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            fileName;


        link.click();



        URL.revokeObjectURL(url);



        return {

            success:true,

            fileName

        };


    }


}