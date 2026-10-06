export default class PhoneDetector {


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



        // Remove spaces, brackets, hyphens

        const cleaned =
            text.replace(
                /[\s\-()]/g,
                ""
            );



        const phonePattern =
            /^\+?\d{10,15}$/;



        return phonePattern.test(
            cleaned
        );


    }


}