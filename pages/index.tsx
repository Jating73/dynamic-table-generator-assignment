import { useState } from "react";
import useLocalStorageState from "use-local-storage-state";

interface Table {
  id: number;
  name: string;
  columns: string[];
  data: string[][][];
  columnAlignment?: Record<number, string>;
}

export default function Home() {
  const [tables, setTables] = useLocalStorageState<Table[]>("tables", { defaultValue: [] });
  const [tableName, setTableName] = useState("");
  const [newColumns, setNewColumns] = useState<string>("");

  // Add a new table
  const addTable = () => {
    if (!tableName || !newColumns.trim()) return;
    setTables([...tables, { id: Date.now(), name: tableName, columns: newColumns.split(","), data: [] }]);
    setTableName("");
    setNewColumns("");
  };

  // Duplicate a table (Copy only headings)
  const duplicateTable = (tableId: number) => {
    const originalTable = tables.find((t) => t.id === tableId);
    if (!originalTable) return;
    setTables([...tables, { id: Date.now(), name: `${originalTable.name} (Copy)`, columns: [...originalTable.columns], data: [] }]);
  };

  // Add a new row
  const addRow = (tableId: number) => {
    setTables(tables.map((t) =>
      t.id === tableId ? { ...t, data: [...t.data, t.columns.map(() => [""])] } : t
    ));
  };

  // Add a new column to a table
  const addColumn = (tableId: number) => {
    setTables(tables.map((t) =>
      t.id === tableId
        ? { ...t, columns: [...t.columns, `New Column ${t.columns.length + 1}`], data: t.data.map(row => [...row, [""]]) }
        : t
    ));
  };

  // Edit a table heading
  const editHeading = (tableId: number, colIndex: number, newHeading: string) => {
    setTables(tables.map((t) =>
      t.id === tableId
        ? { ...t, columns: t.columns.map((col, i) => (i === colIndex ? newHeading || " " : col)) }
        : t
    ));
  };

  // Delete a specific row
  const deleteRow = (tableId: number, rowIndex: number) => {
    setTables(tables.map((t) =>
      t.id === tableId ? { ...t, data: t.data.filter((_, idx) => idx !== rowIndex) } : t
    ));
  };

  // Update a specific cell
  const updateCell = (tableId: number, rowIndex: number, colIndex: number, value: string) => {
    setTables(tables.map((t) =>
      t.id === tableId ? {
        ...t,
        data: t.data.map((row, rIdx) =>
          rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value.split(",").map(v => v.trim()) : cell)) : row
        ),
      } : t
    ));
  };


  const renameTable = (tableId: number, newName: string) => {
    setTables(tables.map((t) =>
      t.id === tableId ? { ...t, name: newName } : t
    ));
  };

  // Delete a column
  const deleteColumn = (tableId: number, colIndex: number) => {
    setTables(tables.map((t) =>
      t.id === tableId
        ? {
          ...t,
          columns: t.columns.filter((_, i) => i !== colIndex),
          data: t.data.map(row => row.filter((_, i) => i !== colIndex))
        }
        : t
    ));
  };

  // Delete a table
  const deleteTable = (tableId: number) => {
    setTables(tables.filter((t) => t.id !== tableId));
  };

  const printTables = () => {
    window.print();
  };

  // Function to toggle text alignment for column values
  const toggleAlignment = (tableId: number, colIndex: number) => {
    setTables(tables.map((t) =>
      t.id === tableId
        ? {
          ...t,
          columnAlignment: {
            ...t.columnAlignment,
            [colIndex]: getNextAlignment(t.columnAlignment?.[colIndex] || "left"),
          },
        }
        : t
    ));
  };

  // Function to cycle between alignments: Left → Center → Right
  const getNextAlignment = (current: string) => {
    return current === "left" ? "center" : current === "center" ? "right" : "left";
  };

  return (
    <div className="container py-4">
      <div className="no-print">
        <h2 className="mb-3">Create New Table</h2>
        <input
          type="text"
          placeholder="Table Name"
          className="form-control mb-2"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Columns (comma separated)"
          className="form-control mb-2"
          value={newColumns}
          onChange={(e) => setNewColumns(e.target.value)}
        />
        <button className="btn btn-primary mb-4" onClick={addTable}>Add Table</button>
        <button className="btn btn-secondary mb-4 ml-2" onClick={printTables}>Print Tables</button>
      </div>

      {tables.map((table) => (
        <div key={table.id} className="mt-3">
          <h4 style={{ textDecoration: "underline", cursor: "pointer" }}>
            <input
              type="text"
              value={table.name}
              className="form-control text-center font-weight-bold border-0"
              onChange={(e) => renameTable(table.id, e.target.value)}
            />
          </h4>
          {/* Table Actions */}
          <button className="btn btn-danger btn-sm no-print" onClick={() => deleteTable(table.id)}>
            Delete Table
          </button>
          <button className="btn btn-warning btn-sm no-print mr-2" onClick={() => duplicateTable(table.id)}>Duplicate</button>
          <button className="btn btn-info btn-sm no-print" onClick={() => addColumn(table.id)}>Add Column</button>

          <div className="table-responsive">
            <table className="table table-bordered resizable-table">
              <thead>
                <tr>
                  {table.columns.map((col, index) => (
                    <th
                      key={index}
                      style={{
                        minWidth: "100px",
                        maxWidth: "auto",
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap", // Ensures multi-line text is formatted correctly
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => editHeading(table.id, index, e.target.innerText)}
                    >
                      {col}
                      {table.columns.length > 1 && (
                        <button
                          className="btn btn-sm btn-danger ml-2 no-print"
                          onClick={() => deleteColumn(table.id, index)}
                        >
                          ✕
                        </button>
                      )}
                    </th>
                  ))}
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          minWidth: "100px",
                          maxWidth: "300px",
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap", // Ensures multi-line content displays properly
                          overflow: "hidden",
                          cursor: "col-resize",
                          textAlign: (table.columnAlignment?.[colIndex] as "left" | "center" | "right") || "center",
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateCell(table.id, rowIndex, colIndex, e.target.innerText)}
                      >
                        {Array.isArray(cell) ? cell.join("\n") : cell}
                      </td>
                    ))}
                    <td className="no-print">
                      <button className="btn btn-danger btn-sm" onClick={() => deleteRow(table.id, rowIndex)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-success btn-sm mb-3 no-print" onClick={() => addRow(table.id)}>Add Row</button>
        </div>
      ))}

      <style jsx global>{`
        .resizable-table {
          width: 100%;
          border-collapse: collapse;
        }

        .resizable-table th, .resizable-table td {
          border: 2px solid black !important;
          padding: 8px !important;
          text-align: center !important;
          word-wrap: break-word;
          white-space: pre-wrap; /* Ensures multi-line text stays formatted */
          vertical-align: middle;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          .resizable-table {
            width: 100% !important;
          }

          th, td {
            page-break-inside: avoid;
          }

          @page {
            margin: 0px;
          }
        }
      `}</style>


    </div>
  );
}
