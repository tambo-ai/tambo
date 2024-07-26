export interface Transaction {
  id: number;
  dollarAmount: number;
  dateIso: string;
  category: string;
  type: "income" | "expense";
}
