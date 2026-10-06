import * as pdfjsLib from "pdfjs-dist";


export interface PDFReaderOptions {

    page?: number;

}



export default class PDFReader {


    async read(
        file: File,
        options: PDFReaderOptions = {}
    ): Promise<any[][]> {


        const {

            page = 1

        } = options;



        const buffer =
            await file.arrayBuffer();



        const pdf =
            await pdfjsLib.getDocument({
                data: buffer
            }).promise;



        const pdfPage =
            await pdf.getPage(page);



        const content =
            await pdfPage.getTextContent();



        const rows:any[][] = [];

        let currentRow:string[] = [];

        let lastY:number | null = null;



        for(
            const item of content.items as any[]
        ){


            const text =
                item.str.trim();



            if(text === "") {

                continue;

            }



            const y =
                Math.round(
                    item.transform[5]
                );



            if(
                lastY !== null &&
                Math.abs(y - lastY) > 5
            ){

                rows.push(currentRow);

                currentRow = [];

            }



            currentRow.push(text);

            lastY = y;


        }



        if(currentRow.length > 0){

            rows.push(currentRow);

        }



        return rows;


    }



}