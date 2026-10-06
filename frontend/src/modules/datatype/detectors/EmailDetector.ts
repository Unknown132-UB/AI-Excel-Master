export default class EmailDetector {


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



        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



        return emailPattern.test(text);


    }


}