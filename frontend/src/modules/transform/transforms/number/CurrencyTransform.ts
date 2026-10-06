import type {
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
  DataType,
} from "../../types/Transform";

export default class CurrencyTransform implements Transform {
  id = "currency";

  name = "Currency Format";

  category = "Number";

  description = "Format a number as currency.";

  supportedTypes: DataType[] = [
    "number",
    "currency",
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
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(num),
    };
  }
}