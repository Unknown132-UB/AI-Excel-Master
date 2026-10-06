import type {
  DataType,
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
} from "../../types/Transform";

export default class LowerCaseTransform implements Transform {
  id: string = "lowercase";

  name: string = "Lower Case";

  category: string = "Text";

  description: string = "Convert text to lowercase.";

  supportedTypes: DataType[] = ["text"];

  execute(
    value: any,
    _context?: TransformContext,
    _options?: TransformOption[]
  ): TransformResult {
    if (value === null || value === undefined) {
      return {
        success: false,
        value,
        message: "Value is empty",
      };
    }

    return {
      success: true,
      value: String(value).toLowerCase(),
    };
  }
}