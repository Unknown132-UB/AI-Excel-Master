export default class CleaningEngine {

    private transforms: Map<string, any>;

    constructor() {

        this.transforms = new Map();

    }


    register(
        name: string,
        transform: any
    ) {

        this.transforms.set(
            name,
            transform
        );

    }


    remove(
        name: string
    ) {

        this.transforms.delete(name);

    }


    get(
        name: string
    ) {

        return this.transforms.get(name);

    }


    getAll() {

        return Array.from(
            this.transforms.keys()
        );

    }


    execute(
        name: string,
        data: any[][],
        options?: any
    ) {


        const transform =
            this.transforms.get(name);



        if (!transform) {

            return {
                success: false,
                data,
                message:
                    `Cleaning transform "${name}" not found`
            };

        }



        try {

            const result =
                transform.execute(
                    data,
                    options
                );


            return {

                success: true,

                data: result

            };


        } catch (error) {


            return {

                success: false,

                data,

                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error"

            };


        }

    }



    executePipeline(
        data: any[][],
        steps: {
            name: string;
            options?: any;
        }[]
    ) {


        let result = data;


        for (const step of steps) {


            const output =
                this.execute(
                    step.name,
                    result,
                    step.options
                );



            if (!output.success) {

                return output;

            }


            result = output.data;

        }



        return {

            success: true,

            data: result

        };

    }


}