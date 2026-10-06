import type {
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
  DataType,
} from "../../types/Transform";

export default class PercentageTransform implements Transform {
  id = "percentage";

  name = "Percentage Format";

  category = "Number";

  description = "Format a number as percentage.";

  supportedTypes: DataType[] = [
    "number",
    "percentage",
  ];

  execute(
    value: any,
    _context?: TransformContext,
    _options?: TransformOption[]
  ): TransformResult {
    if (value === null || value === undefined || value === "") {
      return {
        success: false,
        value,
        message: "Value is empty",
      };
    }

    const num = Number(value);

    if (isNaN(num)) {
      return {
        success: false,
        value,
        message: "Invalid number",
      };
    }

    return {
      success: true,
      value: `${num}%`,
    };
  }
}