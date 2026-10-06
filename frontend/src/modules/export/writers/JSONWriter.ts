export default class JSONWriter {



    write(

        data:any[][],

        fileName:string = "cleaned_data.json"

    ){



        if(
            data.length === 0
        ){

            return {

                success:false,

                message:
                "No data available"

            };

        }




        const headers =
            data[0];



        const rows =
            data.slice(1);



        const jsonData =
            rows.map(
                row => {


                    const obj:any = {};



                    headers.forEach(

                        (header,index)=>{


                            obj[header] =
                                row[index];


                        }

                    );



                    return obj;


                }

            );




        const jsonString =
            JSON.stringify(

                jsonData,

                null,

                2

            );




        const blob =
            new Blob(

                [jsonString],

                {

                    type:
                    "application/json"

                }

            );




        const url =
            URL.createObjectURL(
                blob
            );



        const link =
            document.createElement(
                "a"
            );



        link.href =
            url;



        link.download =
            fileName;



        link.click();



        URL.revokeObjectURL(
            url
        );




        return {


            success:true,


            fileName


        };


    }



}