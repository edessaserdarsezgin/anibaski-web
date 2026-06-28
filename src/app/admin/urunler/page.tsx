import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import ToggleActiveButton from "./ToggleActiveButton";
import DuplicateButton from "./DuplicateButton";

export const metadata = { title: "Ürünler | Admin" };

export default async function AdminUrunlerPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, basePrice, isActive, category:categories!products_categoryId_fkey(name)")
    .order("createdAt", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text">Ürünler</h1>
        <Link href="/admin/urunler/yeni" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors">
          + Yeni Ürün
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {!products?.length ? (
          <p className="text-sm text-text-light p-6">Henüz ürün yok.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg">
              <tr className="text-text-light">
                <th className="text-left px-6 py-3 font-semibold">Ürün</th>
                <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                <th className="text-right px-4 py-3 font-semibold">Fiyat</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={`border-b border-border last:border-0 hover:bg-bg transition-colors ${product.isActive === false ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-text">{product.name}</p>
                    <p className="text-xs text-text-light mt-0.5">{product.slug}</p>
                  </td>
                  <td className="px-4 py-4 text-text-light">{(product.category as unknown as { name: string } | null)?.name}</td>
                  <td className="px-4 py-4 text-right font-semibold text-primary">
                    {Number(product.basePrice).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ToggleActiveButton id={product.id} isActive={product.isActive ?? true} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/urunler/${product.id}/duzenle`} className="text-xs text-primary hover:underline font-semibold">
                        Düzenle
                      </Link>
                      <DuplicateButton id={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
