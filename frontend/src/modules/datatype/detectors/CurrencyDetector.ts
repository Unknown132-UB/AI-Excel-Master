export default class CurrencyDetector {


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



        return /^[$₹€£¥]\s?\d+([,.]\d+)*$/
            .test(text);


    }


}