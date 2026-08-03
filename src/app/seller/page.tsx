"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import AppBar from "@/components/seller/AppBar";
import ProductCard from "@/components/seller/ProductCard";
import AlbumSection from "@/components/seller/AlbumSection";
import { ProductCardSkeleton } from "@/components/seller/SkeletonLoaders";

import { Product, AlbumItem } from "@/types/seller.types";
import {
  fetchAllProducts,
  fetchProductsByCategory,
  fetchAlbumItems,
  getPublicImageUrl,
} from "@/lib/supabase-seller";

// ─── المنتجات الرئيسية (صفحات محلية) ───
// الصور من Supabase Storage bucket: site-assets
const MAIN_PRODUCTS = [
  {
    id: "khamiya",
    name: "خامية مغربية عصرية",
    href: "/seller/khamiya",
    imagePath: "categories/khamiya.jpg",
    icon: "🏠",
  },
  {
    id: "salon",
    name: "صالون مغربي بالثوب",
    href: "/seller/salon",
    imagePath: "categories/salon.jpg",
    icon: "🛋️",
  },
  {
    id: "tapis",
    name: "زربية مغربية عصرية",
    href: "/seller/tapis",
    imagePath: "categories/tapis.jpg",
    icon: "🧶",
  },
  {
    id: "bois",
    name: "خشب الصالونات",
    href: "/seller/bois",
    imagePath: "categories/bois.jpg",
    icon: "🪵",
  },
  {
    id: "bonj",
    name: "بونج الصالونات",
    href: "/seller/foam",
    imagePath: "categories/bonj.jpg",
    icon: "🧽",
  },
];

const MOCK_ALBUM: AlbumItem[] = [
  { id: "a1", title: "صالون كلاسيكي ذهبي", price: 12500, image_url: null, created_at: "2026-07-20" },
  { id: "a2", title: "زربية حريرية 4×5م", price: 8500, image_url: null, created_at: "2026-07-18" },
  { id: "a3", title: "خامية عصرية بيج", price: 3200, image_url: null, created_at: "2026-07-15" },
  { id: "a4", title: "صالون أزرق ملكي", price: 15000, image_url: null, created_at: "2026-07-10" },
  { id: "a5", title: "بونج عالي الكثافة", price: 1800, image_url: null, created_at: "2026-07-05" },
];

export default function SellerDashboard() {
  const router = useRouter();

  const [currentView, setCurrentView] = useState<"home" | "products">("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ─── Data Fetching ───
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, album] = await Promise.all([
        fetchAllProducts(),
        fetchAlbumItems(),
      ]);
      setProducts(prods);
      setAlbumItems(album.length > 0 ? album : MOCK_ALBUM);
    } catch (err) {
      setProducts([]);
      setAlbumItems(MOCK_ALBUM);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setProductsLoading(true);
    try {
      const results = await fetchAllProducts(query);
      setProducts(results);
    } catch {
      setProducts([]);
    }
    setProductsLoading(false);
  }, []);

  // Category filter
  const handleCategoryClick = useCallback(async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentView("products");
    setProductsLoading(true);
    try {
      const results = await fetchProductsByCategory(categoryName, searchQuery);
      setProducts(results);
    } catch {
      setProducts([]);
    }
    setProductsLoading(false);
  }, [searchQuery]);

  // Favorite toggle
  const handleFavoriteToggle = useCallback(async (productId: string, isFavorite: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_favorite: !isFavorite } : p))
    );
  }, []);

  // Navigate
  const handleNavigate = useCallback((page: string) => {
    if (page === "home") {
      setCurrentView("home");
      setSelectedCategory(null);
      setSearchQuery("");
      loadInitialData();
    }
  }, [loadInitialData]);

  const handleLogout = useCallback(() => {
    router.push("/");
  }, [router]);

  // ─── Render ───
  return (
    <>
      <AppBar
        logoUrl="logo.jpg"
        storeName="Ameublement et Déco El Mahboubi"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Mobile Search */}
              <div className="md:hidden">
                <div className="relative">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20 focus:border-[#1B5E3B]/30 shadow-sm"
                  />
                </div>
              </div>

              {/* ─── منتجاتنا الرئيسية (5 بطاقات) ─── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">منتجاتنا</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MAIN_PRODUCTS.map((product, index) => {
                    const imageUrl = getPublicImageUrl("site-assets", product.imagePath);
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.4 }}
                      >
                        <Link
                          href={product.href}
                          className="group relative overflow-hidden rounded-[20px] bg-white shadow-sm hover:shadow-xl transition-all duration-500 text-right flex flex-col block h-full"
                        >
                          {/* Image */}
                          <div className="relative h-44 sm:h-52 overflow-hidden bg-[#F5F0E8]">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                sizes="(max-width: 640px) 50vw, 20vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">
                                {product.icon}
                              </div>
                            )}
                            {/* Dark bottom overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1B5E3B]/90 to-transparent" />
                          </div>

                          {/* Title overlay */}
                          <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                            <h3 className="font-bold text-white text-sm sm:text-base">{product.name}</h3>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* ─── منتجات مميزة (من Supabase) ─── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                    <h2 className="text-lg font-bold text-gray-900">منتجات مميزة</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loading || productsLoading
                    ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} index={i} />)
                    : products.slice(0, 8).map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={i}
                          onFavoriteToggle={handleFavoriteToggle}
                          onQuickView={(p) => console.log("Quick view:", p)}
                          onAddToOrder={(p) => console.log("Add to order:", p)}
                        />
                      ))}
                </div>

                {products.length === 0 && !productsLoading && !loading && (
                  <div className="text-center py-16 bg-white rounded-[20px] shadow-sm">
                    <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">لا توجد منتجات مميزة</p>
                  </div>
                )}
              </section>

              {/* ─── ألبوم الأعمال ─── */}
              <AlbumSection items={albumItems} loading={loading} />
            </motion.div>
          )}

          {currentView === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentView("home");
                    setSelectedCategory(null);
                    loadInitialData();
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategory || "جميع المنتجات"}
                </h1>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {productsLoading
                  ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} index={i} />)
                  : products.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                        onFavoriteToggle={handleFavoriteToggle}
                        onQuickView={(p) => console.log("Quick view:", p)}
                        onAddToOrder={(p) => console.log("Add to order:", p)}
                      />
                    ))}
              </div>

              {products.length === 0 && !productsLoading && (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">لا توجد منتجات</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}