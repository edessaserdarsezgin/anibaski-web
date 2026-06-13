import { Suspense } from "react";
import TagFilter from "@/components/product/TagFilter";
import SortSelect from "@/components/product/SortSelect";

type Tag = { id: string; name: string; color: string };

/**
 * Ürün listesi filtre + sıralama çubuğu — TEK modül.
 * Header'ın hemen altına oturan tam-genişlik sticky alt-çubuk (`top-16` = header yüksekliği).
 * Kullanım: /urunler, /kategoriler/[slug] (ve ileride arama vb. — buraya tek noktadan eklenir).
 */
export default function ProductFilterBar({
  tags,
  currentTag,
  currentSort,
}: {
  tags: Tag[];
  currentTag?: string;
  currentSort?: string;
}) {
  return (
    <div
      className="sticky z-40 bg-bg/95 backdrop-blur border-b border-border"
      style={{ top: "var(--header-h, 4rem)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <Suspense fallback={<div className="h-9" />}>
          <TagFilter tags={tags} current={currentTag} />
        </Suspense>
        <Suspense fallback={<div className="w-40 h-9 rounded-lg border border-border bg-bg" />}>
          <SortSelect current={currentSort} />
        </Suspense>
      </div>
    </div>
  );
}
