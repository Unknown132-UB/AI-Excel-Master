import type {
  Transform,
  TransformContext,
  TransformOption,
  TransformResult,
  DataType,
} from "../../types/Transform";

export default class TimeFormatTransform implements Transform {
  id = "timeformat";

  name = "Time Format";

  category = "Date";

  description = "Format time into HH:MM:SS.";

  supportedTypes: DataType[] = [
    "time",
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
        message: "Invalid time",
      };
    }

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return {
      success: true,
      value: `${hours}:${minutes}:${seconds}`,
    };
  }
}