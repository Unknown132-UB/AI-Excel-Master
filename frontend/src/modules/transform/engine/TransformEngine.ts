import type { Transform } from "../types/Transform";

export default class TransformEngine {
  private transforms: Map<string, Transform>;

  constructor() {
    this.transforms = new Map();
  }

  register(transform: Transform): void {
    this.transforms.set(transform.id, transform);
  }

  unregister(id: string): void {
    this.transforms.delete(id);
  }

  get(id: string): Transform | undefined {
    return this.transforms.get(id);
  }

  getAll(): Transform[] {
    return Array.from(this.transforms.values());
  }

  execute(
    id: string,
    value: any,
    context?: any,
    options?: any
  ) {
    const transform = this.transforms.get(id);

    if (!transform) {
      return {
        success: false,
        value,
        message: `Transform "${id}" not found.`,
      };
    }

    // If value is a 2D array (table), apply transform to each cell
    if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
      const result = value.map((row: any[]) =>
        row.map((cell: any) => {
          const cellResult = transform.execute(cell, context, options);
          return cellResult.success ? cellResult.value : cell;
        })
      );

      return {
        success: true,
        value: result,
      };
    }

    return transform.execute(value, context, options);
  }

  executeColumn(
    id: string,
    values: any[]
  ) {
    return values.map((value, index) =>
      this.execute(id, value, {
        row: index,
      })
    );
  }

  executeTable(
    id: string,
    table: any[],
    column: string
  ) {
    return table.map((row, index) => {
      const result = this.execute(
        id,
        row[column],
        {
          row: index,
          column,
        }
      );

      return {
        ...row,
        [column]: result.value,
      };
    });
  }
}