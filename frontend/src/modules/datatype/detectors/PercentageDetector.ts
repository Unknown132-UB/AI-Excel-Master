export default class PercentageDetector {


    detect(
        value: any
    ): boolean {


        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return false;

        }



        const text =
            String(value)
            .trim();



        return /^\d+(\.\d+)?%$/
            .test(text);


    }


}