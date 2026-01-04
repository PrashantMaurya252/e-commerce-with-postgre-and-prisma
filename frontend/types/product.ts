export enum Category {
  ELECTRONICS = "ELECTRONICS",
  CLOTHES = "CLOTHES",
  DAILY_USAGE = "DAILY_USAGE",
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  isInCart:boolean,
  cartQuantity:number
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

// types/product.ts
export interface ApiProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  offerPrice: number;
  isOfferActive: boolean;
  category: Category;
  files: { url: string; type: "IMAGE" | "VIDEO" }[];
}

export interface UIProduct {
  id: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  isOfferActive: boolean;
  offerPrice?: number;
}

// types/product.ts
export interface ProductFile {
  id: string
  url: string
  type: "IMAGE"
}

export interface ProductDetails {
  id: string
  title: string
  description: string
  price: number
  offerPrice: number
  isOfferActive: boolean
  files: ProductFile[]
}
