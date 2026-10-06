export type EncodingType =
    | "UTF-8"
    | "UTF-16"
    | "ASCII"
    | "UNKNOWN";


export default class EncodingDetector {


    async detect(
        file: File
    ): Promise<EncodingType> {


        const buffer =
            await file.arrayBuffer();


        const bytes =
            new Uint8Array(buffer);



        // UTF-8 BOM

        if (
            bytes[0] === 0xEF &&
            bytes[1] === 0xBB &&
            bytes[2] === 0xBF
        ) {

            return "UTF-8";

        }



        // UTF-16 Little Endian BOM

        if (
            bytes[0] === 0xFF &&
            bytes[1] === 0xFE
        ) {

            return "UTF-16";

        }



        // UTF-16 Big Endian BOM

        if (
            bytes[0] === 0xFE &&
            bytes[1] === 0xFF
        ) {

            return "UTF-16";

        }



        // ASCII Check

        let ascii = true;


        for (
            let i = 0;
            i < Math.min(bytes.length, 1000);
            i++
        ) {


            if (bytes[i] > 127) {

                ascii = false;

                break;

            }

        }



        if (ascii) {

            return "ASCII";

        }



        // Default

        return "UNKNOWN";


    }



    async getText(
        file: File
    ): Promise<string> {


        const encoding =
            await this.detect(file);



        let decoder:


        TextDecoder;



        switch(encoding) {


            case "UTF-16":

                decoder =
                    new TextDecoder(
                        "utf-16"
                    );

                break;



            case "ASCII":

                decoder =
                    new TextDecoder(
                        "ascii"
                    );

                break;



            default:

                decoder =
                    new TextDecoder(
                        "utf-8"
                    );

        }



        const buffer =
            await file.arrayBuffer();



        return decoder.decode(buffer);

    }


}