export const redisKeys = {
    product: (productId: string) => `product:${productId}`,
    cart: (userId: string) => `cart:${userId}`,
    session: (userId: string) => `session:${userId}`,
    user: (userId: string) => `user:${userId}`,
    wishlist: (userId: string) => `wishlist:${userId}`,
    rateLimit: (ip: string) => `rateLimit:${ip}`,
    reviews: (productId: string) => `reviews:${productId}`,
    products: "products",
    productsByCategory: (categoryId: string) => `products:category:${categoryId}`
}