export default class DateDetector {


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



        // Avoid detecting numbers as dates

        if (
            /^\d+$/.test(text)
        ) {

            return false;

        }



        // Common date patterns

        const datePattern =
            /^(\d{1,4})[-\/](\d{1,2})[-\/](\d{1,4})$/;



        const monthNamePattern =
            /^\d{1,2}[-\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]\d{4}$/i;



        if (
            datePattern.test(text) ||
            monthNamePattern.test(text)
        ) {

            const date =
                new Date(text);



            return !isNaN(
                date.getTime()
            );

        }



        // Native date detection

        const parsed =
            Date.parse(text);



        return !isNaN(parsed);


    }


}