import type {
  DataType,
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
} from "../../types/Transform";

export default class UpperCaseTransform implements Transform {
  id: string = "uppercase";

  name: string = "Upper Case";

  category: string = "Text";

  description: string = "Convert text to uppercase.";

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
      value: String(value).toUpperCase(),
    };
  }
}