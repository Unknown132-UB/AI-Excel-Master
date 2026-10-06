import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "../utils/GridTheme.css";

interface SpreadsheetProps {
  rowData: any[];
  columnDefs: ColDef[];
}

export default function Spreadsheet({
  rowData,
  columnDefs,
}: SpreadsheetProps) {
  return (
    <div
      className="ag-theme-quartz-dark"
      style={{
        width: "100%",
        height: "600px",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          editable: true,
          resizable: true,
          flex: 1,
        }}
        animateRows
      />
    </div>
  );
}