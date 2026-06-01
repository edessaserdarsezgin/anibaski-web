"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Tag = { id: string; name: string; color: string };

export default function TagFilter({ tags, current }: { tags: Tag[]; current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!tags.length) return null;

  function handleClick(tagId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!tagId || tagId === current) {
      params.delete("tag");
    } else {
      params.set("tag", tagId);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => handleClick(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          !current
            ? "bg-text text-white border-text"
            : "border-border text-text-light hover:border-primary hover:text-primary"
        }`}
      >
        Tümü
      </button>
      {tags.map(tag => (
        <button
          key={tag.id}
          onClick={() => handleClick(tag.id)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
          style={
            current === tag.id
              ? { backgroundColor: tag.color, color: "white", borderColor: tag.color }
              : { borderColor: "#ece8e1", color: "#8187a2" }
          }
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
