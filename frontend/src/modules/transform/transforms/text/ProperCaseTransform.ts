import type {
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
} from "../../types/Transform";

export default class ProperCaseTransform implements Transform {
  id = "propercase";

  name = "Proper Case";

  category = "Text";

  description = "Convert text to Proper Case.";

  supportedTypes: ("text")[] = ["text"];

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

    const result = String(value)
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      success: true,
      value: result,
    };
  }
}