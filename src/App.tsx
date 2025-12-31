import { useState, useRef } from "react";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import "./App.css";
import { registerAllModules } from "handsontable/registry";
import { HotTable } from "@handsontable/react-wrapper";
import { columns, data } from "./data";

registerAllModules();

function App() {
  const [savedColumnWidths, setSavedColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem("handsontable-column-widths");
      if (!saved || saved === "undefined" || saved === "null") {
        return [];
      }
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Failed to parse saved column widths:", error);
      return [];
    }
  });

  const hotRef = useRef<any>(null);

  const checkForDuplicates = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const columnsToCheck = [1, 4, 6]; // email_message_id, JobId, Email

    columnsToCheck.forEach((col) => {
      const colData = hot.getDataAtCol(col);
      const counts = new Map();

      // Count occurrences
      colData.forEach((val: any) => {
        if (val) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      });

      // Update cell meta
      colData.forEach((val: any, row: number) => {
        const isDuplicate = val && counts.get(val) > 1;

        // We only modify if needed to minimize churn only if strictly necessary, 
        // but calling setCellMeta is generally cheap if value is same. 
        // Ideally we check current meta.
        const cellMeta = hot.getCellMeta(row, col);

        if (isDuplicate) {
          if (cellMeta.className !== "duplicate-cell") {
            hot.setCellMeta(row, col, "className", "duplicate-cell");
          }
        } else {
          if (cellMeta.className === "duplicate-cell") {
            hot.removeCellMeta(row, col, "className");
          }
        }
      });
    });

    hot.render();
  };

  return (
    <div className="ht-wrapper" style={{ width: "100%", padding: 0 }}>
      <HotTable
        ref={hotRef}
        themeName="ht-theme-main"
        height="95vh"
        pagination={{
          pageSize: 50,
          pageSizeList: ["auto", 5, 10, 20, 50, 100],
          initialPage: 2,
          showPageSize: true,
          showCounter: true,
          showNavigation: true,
        }}
        data={data}
        colHeaders={columns}
        afterChange={(_changes, source) => {
          // Trigger duplicate check on any change that might affect data
          if (["edit", "CopyPaste.paste", "Autofill.fill", "Undo", "Redo"].includes(source)) {
            checkForDuplicates();
          }
        }}
        afterUndo={checkForDuplicates}
        afterRedo={checkForDuplicates}
        fixedColumnsStart={6}
        autoColumnSize={{
          useHeaders: true,
        }}
        manualColumnResize={savedColumnWidths}
        afterColumnResize={(newSize, column) => {
          const prevColWidths = [...savedColumnWidths];
          prevColWidths[column] = newSize;
          setSavedColumnWidths(prevColWidths);
          localStorage.setItem(
            "handsontable-column-widths",
            JSON.stringify(prevColWidths),
          );
        }}
        dropdownMenu={true}
        multiColumnSorting={true}
        filters={true}
        hiddenColumns={{
          columns: [26, 27, 28, 29, 30],
          indicators: true,
          copyPasteEnabled: false,
        }}
        headerClassName="htCenter my-class"
        className="is-noWrapCell"
        wordWrap={false}
        rowHeaders={true}
        contextMenu={[
          "cut",
          "copy",
          "---------",
          "row_above",
          "row_below",
          "remove_row",
          "---------",
          "hidden_rows_show",
          "hidden_rows_hide",
          "hidden_columns_show",
          "hidden_columns_hide",
        ]}
        hiddenRows={{
          indicators: true,
          copyPasteEnabled: false,
        }}
        manualRowMove={true}
        autoWrapRow={false}
        manualRowResize={true}
        navigableHeaders={true}
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
      />
    </div>
  );
}

export default App;
