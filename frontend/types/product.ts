export enum Category {
  ELECTRONICS = "ELECTRONICS",
  CLOTHES = "CLOTHES",
  DAILY_USAGE = "DAILY_USAGE",
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  image: string;
}
