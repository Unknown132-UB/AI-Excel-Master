import SplitByDelimiter from "./transforms/SplitByDelimiter";
import SplitByPipe from "./transforms/SplitByPipe";
import SplitByComma from "./transforms/SplitByComma";
import SplitBySemicolon from "./transforms/SplitBySemicolon";
import SplitByColon from "./transforms/SplitByColon";
import SplitByTab from "./transforms/SplitByTab";
import SplitBySpace from "./transforms/SplitBySpace";
import SplitFixedWidth from "./transforms/SplitFixedWidth";
import MergeColumns from "./transforms/MergeColumns";

export default class SplitRegistry {

    private transforms = new Map<string, any>();

    constructor() {

        this.register("delimiter", new SplitByDelimiter());

        this.register("pipe", new SplitByPipe());

        this.register("comma", new SplitByComma());

        this.register("semicolon", new SplitBySemicolon());

        this.register("colon", new SplitByColon());

        this.register("tab", new SplitByTab());

        this.register("space", new SplitBySpace());

        this.register("fixedwidth", new SplitFixedWidth());

        this.register("merge", new MergeColumns());

    }

    register(name: string, transform: any) {

        this.transforms.set(name, transform);

    }

    get(name: string) {

        return this.transforms.get(name);

    }

    getAll() {

        return Array.from(this.transforms.entries()).map(([name, transform]) => ({
            name,
            transform
        }));

    }

}