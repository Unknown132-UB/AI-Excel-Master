export interface GeminiRequest {

    prompt: string;

}


export interface GeminiResponse {

    success: boolean;

    text: string;

}



export default class GeminiProvider {


    private apiKey: string;

    private model: string;



    constructor(
        apiKey: string
    ) {


        this.apiKey = apiKey;


        this.model =
            "gemini-1.5-flash";


    }




    async generate(
        request: GeminiRequest
    ): Promise<GeminiResponse> {



        try {


            const response =
                await fetch(

`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,

                {

                    method:"POST",


                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:JSON.stringify({

                        contents:[

                            {

                                parts:[

                                    {

                                        text:
                                        request.prompt

                                    }

                                ]

                            }

                        ]

                    })

                }

            );



            const data =
                await response.json();



            const text =
                data
                ?.candidates?.[0]
                ?.content
                ?.parts?.[0]
                ?.text;



            return {

                success:true,

                text:
                    text || "No response"

            };



        }

        catch(error){


            return {

                success:false,

                text:
                "Gemini API error"

            };


        }


    }


}