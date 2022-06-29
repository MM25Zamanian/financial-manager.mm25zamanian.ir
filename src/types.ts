interface dataTable {
  rows: string[];
}

export class DataTableRow implements dataTable {
  rows: string[];

  constructor(_rows: string[]) {
    this.rows = _rows;
  }
}
