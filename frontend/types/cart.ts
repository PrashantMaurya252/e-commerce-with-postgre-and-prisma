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

export interface Coupon{
    total:number,
    coupon:string,
    subTotal:number,
    discount:number,
    success:boolean
}

export interface CouponListItem {
  id: string;
  code: string;
  discountType: "FLAT" | "PERCENT";
  discountValue: number;
  maxDiscount: number;
  minCartValue: number;
  expiresAt: string;
}
