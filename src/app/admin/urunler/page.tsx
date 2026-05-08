import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Ürünler | Admin" };

export default async function AdminUrunlerPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[var(--color-text)]">Ürünler</h1>
        <Link
          href="/admin/urunler/yeni"
          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-full transition-colors"
        >
          + Yeni Ürün
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {products.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)] p-6">Henüz ürün yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <tr className="text-[var(--color-text-light)]">
                <th className="text-left px-6 py-3 font-semibold">Ürün</th>
                <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                <th className="text-right px-6 py-3 font-semibold">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[var(--color-text)]">{product.name}</p>
                    <p className="text-xs text-[var(--color-text-light)] mt-0.5">{product.slug}</p>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-light)]">{product.category.name}</td>
                  <td className="px-6 py-4 text-right font-semibold text-[var(--color-primary)]">
                    {Number(product.basePrice).toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
