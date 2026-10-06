export type DataType =
    | "text"
    | "number"
    | "date"
    | "currency"
    | "percentage"
    | "email"
    | "phone"
    | "url"
    | "boolean"
    | "mixed";



export default class DetectType {


    detect(
        value: any
    ): DataType {


        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "mixed";

        }



        const text =
            String(value)
            .trim();



        // Currency

        if (
            /^[$₹€£¥]\s?\d+([,.]\d+)*$/
            .test(text)
        ) {

            return "currency";

        }



        // Percentage

        if (
            /^\d+(\.\d+)?%$/
            .test(text)
        ) {

            return "percentage";

        }



        // Email

        if (
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(text)
        ) {

            return "email";

        }



        // URL

        if (
            /^(https?:\/\/)/
            .test(text)
        ) {

            return "url";

        }



        // Phone

        if (
            /^[+]?\d{10,15}$/
            .test(text.replace(/\s/g,""))
        ) {

            return "phone";

        }



        // Boolean

        const lower =
            text.toLowerCase();



        if (

            [
                "true",
                "false",
                "yes",
                "no",
                "active",
                "inactive",
                "1",
                "0"

            ]
            .includes(lower)

        ) {

            return "boolean";

        }



        // Number

        if (
            !isNaN(
                Number(
                    text.replace(/,/g,"")
                )
            )
        ) {

            return "number";

        }



        // Date

        if (
            !isNaN(
                Date.parse(text)
            )
        ) {

            return "date";

        }



        return "text";


    }


}