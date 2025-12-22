import Image from "next/image";

const Home = () => {
  return (
    <main className="w-full">
      {/* HERO SECTION */}
      <section className="relative bg-[#f7efe5]">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Welcome to <span className="text-orange-600">Desi Market</span>
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Your one-stop destination for authentic Indian groceries,
              fashion, and daily essentials.
            </p>
            <button className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition">
              Shop Now
            </button>
          </div>

          <div className="relative w-full h-[300px] md:h-[400px]">
            <Image
              src="https://images.unsplash.com/photo-1604908554026-28b43f4b62b8"
              alt="Desi Market Banner"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* CATEGORY BANNERS */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Shop by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Groceries", img: "https://images.unsplash.com/photo-1542838132-92c53300491e" },
            { title: "Ethnic Wear", img: "https://images.unsplash.com/photo-1593032465171-b0e7b4b7b5a7" },
            { title: "Spices", img: "https://images.unsplash.com/photo-1604908177522-b79c72e34e6e" },
            { title: "Home Essentials", img: "https://images.unsplash.com/photo-1586864387789-628af9feed72" },
          ].map((item) => (
            <div
              key={item.title}
              className="relative h-40 rounded-xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={item.img}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-110 transition"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <h3 className="text-white text-lg font-semibold">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Festival Special Offers 🎉</h2>
          <p className="mt-2 text-lg">
            Get up to <span className="font-semibold">40% OFF</span> on selected
            Desi products
          </p>
          <button className="mt-5 bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
            Explore Deals
          </button>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="border rounded-xl p-4 hover:shadow-lg transition"
            >
              <div className="relative w-full h-40 mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1586201375754-1421a6f7d95d"
                  alt="Product"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="font-medium text-gray-800">
                Desi Organic Product
              </h3>
              <p className="text-orange-600 font-semibold mt-1">₹499</p>
              <button className="mt-3 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Why Choose Desi Market?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">Authentic Products</h3>
              <p className="text-gray-600 mt-2">
                100% genuine and traditional Indian products
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">Fast Delivery</h3>
              <p className="text-gray-600 mt-2">
                Quick and safe delivery at your doorstep
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg">Best Prices</h3>
              <p className="text-gray-600 mt-2">
                Affordable prices with exciting offers
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
