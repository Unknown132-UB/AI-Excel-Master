export default class NumberDetector {


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



        // Remove commas for checking

        const cleaned =
            text.replace(/,/g, "");



        // Reject percentage

        if (
            cleaned.endsWith("%")
        ) {

            return false;

        }



        // Reject currency symbols

        if (
            /^[$₹€£¥]/
            .test(cleaned)
        ) {

            return false;

        }



        return !isNaN(
            Number(cleaned)
        );


    }


}