import ExcelJS from "exceljs";
//Reusable Setup
export const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.properties.defaultRowHeight = 18;

  return { workbook, sheet };
};

export const applyTableBorder = (row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
};