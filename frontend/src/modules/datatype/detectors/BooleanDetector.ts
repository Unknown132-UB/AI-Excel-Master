export default class BooleanDetector {


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
            .trim()
            .toLowerCase();



        const booleanValues = [

            "true",
            "false",

            "yes",
            "no",

            "y",
            "n",

            "1",
            "0",

            "active",
            "inactive",

            "enabled",
            "disabled",

            "on",
            "off"

        ];



        return booleanValues.includes(
            text
        );


    }


}