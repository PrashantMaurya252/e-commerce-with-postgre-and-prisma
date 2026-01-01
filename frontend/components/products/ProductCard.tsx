"use client";

import Image from "next/image";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";

import {
  useAddToCartMutation,
  useDecreaseFromCartMutation,
  useDeleteFromCartMutation,
} from "@/redux/services/cartApi";

export default function ProductCard({
  product,
  handleProductAddedToCart,
  handleProductDecreaseFromCart,
  handleProductRemovedFromCart,
}: {
  product: Product;
  handleProductAddedToCart: (id: string) => void;
  handleProductDecreaseFromCart: (id: string) => void;
  handleProductRemovedFromCart: (id: string) => void;
}) {
  const router = useRouter();

  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [decreaseFromCart, { isLoading: decreasing }] =
    useDecreaseFromCartMutation();
  const [removeFromCart, { isLoading: removing }] =
    useDeleteFromCartMutation();

  /* ---------- Handlers ---------- */

  const handleAdd = async () => {
    await addToCart(product.id).unwrap();
    handleProductAddedToCart(product.id);
  };

  const handleDecrease = async () => {
    if (product.cartQuantity === 1) {
      await removeFromCart(product.id).unwrap();
      handleProductRemovedFromCart(product.id);
      return;
    }

    await decreaseFromCart(product.id).unwrap();
    handleProductQuantityChange(product.id, "DEC");
  };

  const handleIncrease = async () => {
    await addToCart(product.id).unwrap();
    handleProductQuantityChange(product.id, "INC");
  };

  /* ---------- UI ---------- */

  return (
    <div className="border rounded-xl p-4 hover:shadow-lg transition relative">
      {/* Image */}
      <div
        className="relative h-40 mb-3 cursor-pointer"
        onClick={() => router.push(`/user/products/${product.id}`)}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* Info */}
      <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
      <p className="text-orange-600 font-semibold">₹{product.price}</p>

      {/* ---------- ACTIONS ---------- */}
      {!product.isInCart ? (
        /* ADD TO CART */
        <button
          disabled={adding}
          onClick={handleAdd}
          className="mt-3 w-full bg-orange-600 text-white py-2 rounded-md text-sm hover:bg-orange-700 disabled:opacity-60"
        >
          Add to Cart
        </button>
      ) : (
        /* QUANTITY CONTROLS */
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            disabled={decreasing}
            onClick={handleDecrease}
            className="w-9 h-9 rounded-md border text-lg font-bold hover:bg-gray-100"
          >
            −
          </button>

          <span className="text-sm font-semibold">
            {product.cartQuantity}
          </span>

          <button
            disabled={adding}
            onClick={handleIncrease}
            className="w-9 h-9 rounded-md border text-lg font-bold hover:bg-gray-100"
          >
            +
          </button>
        </div>
      )}

      {/* REMOVE + GO TO CART */}
      {product.isInCart && (
        <div className="mt-2 flex gap-2">
          <button
            disabled={removing}
            onClick={() => {
              removeFromCart(product.id);
              handleProductRemovedFromCart(product.id);
            }}
            className="flex-1 border border-red-500 text-red-600 py-2 rounded-md text-sm hover:bg-red-50"
          >
            Remove
          </button>

          <button
            onClick={() => router.push("/user/cart")}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Go to Cart
          </button>
        </div>
      )}

      {/* VIEW DETAILS */}
      <button
        onClick={() => router.push(`/user/products/${product.id}`)}
        className="mt-3 w-full text-sm text-gray-600 hover:text-black underline"
      >
        View Details
      </button>

      {/* Badge */}
      {product.isInCart && (
        <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
          In Cart
        </span>
      )}
    </div>
  );
}
