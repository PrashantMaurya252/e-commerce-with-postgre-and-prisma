export const redisKeys = {
    product: (productId: string) => `product:${productId}`,
    cart: (userId: string) => `cart:${userId}`,
    session: (userId: string) => `session:${userId}`,
    user: (userId: string) => `user:${userId}`,
    wishlist: (userId: string) => `wishlist:${userId}`,
    rateLimit: (ip: string) => `rateLimit:${ip}`,
    reviews: (productId: string) => `reviews:${productId}`,
    products: (params: {
    page: number;
    limit: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    brand?: string[];
  }) => {
    const {
      page,
      limit,
      categoryId = "all",
      minPrice = "none",
      maxPrice = "none",
      search = "none",
      brand = [],
    } = params;

    const normalizedBrand = [...brand]
      .map((b) => b.trim().toLowerCase())
      .sort()
      .join(",");

    return [
      "products",
      `page=${page}`,
      `limit=${limit}`,
      `category=${categoryId}`,
      `minPrice=${minPrice}`,
      `maxPrice=${maxPrice}`,
      `search=${search || "none"}`,
      `brand=${normalizedBrand || "none"}`,
    ].join(":");
  },
}