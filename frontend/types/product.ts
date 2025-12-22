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

export interface ProductFilter{
    search?:string,
    page?:number,
    limit?:number,
    price?:number,
    category?:string
}

export interface Product2{
    id:string,
    title:string,
    description:string,
    price:number,
    offerPrice:number,
    isOfferActive:boolean,
    category:string,
    itemLeft:number,
    disabled:boolean,
    createdAt:string,
    files:string[]
}

export interface ProductAPIResponse{
    success:boolean,
    message:string,
    page?:number,
    limit?:number,
    totalProducts?:number,
    totalPages?:number,
    data:Product2[]
}
