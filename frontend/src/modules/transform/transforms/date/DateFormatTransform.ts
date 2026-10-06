import type {
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
  DataType,
} from "../../types/Transform";

export default class DateFormatTransform implements Transform {
  id = "dateformat";

  name = "Date Format";

  category = "Date";

  description = "Format date into DD/MM/YYYY.";

  supportedTypes: DataType[] = [
    "date",
    "datetime",
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

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return {
        success: false,
        value,
        message: "Invalid date",
      };
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return {
      success: true,
      value: `${day}/${month}/${year}`,
    };
  }
}