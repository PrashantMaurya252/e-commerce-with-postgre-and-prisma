import { Product2 } from "./product"

export interface CartItem{
    id:string
    productId:string
    quantity:number
    product:Product2
}

export interface CartState{
    items:CartItem[];
    total:0;
    loading:boolean;
    error:string;
}