import EncodingDetector from "../detectors/EncodingDetector";


export interface CSVReaderOptions {

    delimiter?: string;

    hasHeader?: boolean;

    autoDetectDelimiter?: boolean;

}



export default class CSVReader {


    private encodingDetector: EncodingDetector;


    constructor() {

        this.encodingDetector =
            new EncodingDetector();

    }



    async read(
        file: File,
        options: CSVReaderOptions = {}
    ): Promise<any[][]> {


        const {

            delimiter,

            autoDetectDelimiter = true

        } = options;



        const text =
            await this.encodingDetector.getText(file);



        // Strip BOM if present
        const cleanText =
            text.replace(/^\uFEFF/, "");



        const detectedDelimiter =
            delimiter ??
            (
                autoDetectDelimiter
                    ? this.detectDelimiter(cleanText)
                    : ","
            );



        const rows =
            this.parseCSV(
                cleanText,
                detectedDelimiter
            );



        return rows;

    }




    private detectDelimiter(
        text: string
    ): string {


        const delimiters = [

            ",",
            "|",
            ";",
            "\t",
            ":"

        ];



        // Use first few non-empty lines for better detection
        const lines =
            text
            .replace(/\r/g, "")
            .split("\n")
            .filter(line => line.trim() !== "")
            .slice(0, 5);



        if (lines.length === 0) {

            return ",";

        }



        let best = ",";

        let maxCount = 0;

        let bestConsistency = 0;



        for (const delimiter of delimiters) {


            let totalCount = 0;

            let consistentLines = 0;

            let lineCounts: number[] = [];


            for (const line of lines) {


                const count =
                    line.split(delimiter).length - 1;


                totalCount += count;

                lineCounts.push(count);


                if (count > 0) {

                    consistentLines++;

                }

            }


            // Prefer delimiter that appears in ALL sample lines (consistent)
            const consistency =
                lines.length > 0
                    ? consistentLines / lines.length
                    : 0;


            if (
                totalCount > maxCount &&
                consistency >= bestConsistency
            ) {

                maxCount = totalCount;

                best = delimiter;

                bestConsistency = consistency;

            }

            // If equal count, prefer the one with better consistency
            else if (
                totalCount === maxCount &&
                consistency > bestConsistency
            ) {

                best = delimiter;

                bestConsistency = consistency;

            }

        }


        return best;

    }




    private parseCSV(
        text: string,
        delimiter: string
    ): any[][] {


        const rows: any[][] = [];

        let current: string[] = [];

        let field = "";

        let inQuotes = false;



        const pushField = () => {

            current.push(field.trim());

            field = "";

        };



        const pushRow = () => {

            pushField();

            if (current.length > 0 && current.some(cell => cell !== "")) {

                rows.push(current);

            }

            current = [];

        };



        const chars =
            text
            .replace(/\r/g, "")
            .split("");


        for (let i = 0; i < chars.length; i++) {

            const char = chars[i];


            if (inQuotes) {

                if (char === '"') {

                    // Check for escaped quotes ""
                    if (chars[i + 1] === '"') {

                        field += '"';

                        i++;

                    } else {

                        inQuotes = false;

                    }

                } else {

                    field += char;

                }

            } else {

                if (char === '"') {

                    inQuotes = true;

                } else if (char === delimiter) {

                    pushField();

                } else if (char === "\n") {

                    pushRow();

                } else {

                    field += char;

                }

            }

        }


        // Handle last row without trailing newline
        if (field !== "" || current.length > 0) {

            pushRow();

        }


        return rows;

    }


}