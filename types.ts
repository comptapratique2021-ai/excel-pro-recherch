
export type Row = (string | number)[];

export interface ExcelData {
    headers: string[];
    rows: Row[];
}

export interface SearchResult {
    item: { [key: string]: string | number };
    refIndex: number;
    score?: number;
}
