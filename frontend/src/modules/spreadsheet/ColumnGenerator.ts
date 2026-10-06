import type { ColDef } from "ag-grid-community";

export function generateColumns(data: any[]): ColDef[] {
  if (!data || data.length === 0) {
    return [];
  }

  return Object.keys(data[0]).map((key) => ({
    field: key,
    headerName: key,
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
    flex: 1,
  }));
}