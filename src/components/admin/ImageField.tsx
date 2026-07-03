"use client";

/** Admin görsel yükleme alanı — kategori/koleksiyon formlarında ortak (DRY). */
export default function ImageField({ value, uploading, onUpload, onClear }: {
  value: string; uploading: boolean; onUpload: (f: File) => void; onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
      ) : (
        <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-text-light text-center px-1">Görsel yok</div>
      )}
      <label className="text-sm text-primary font-semibold cursor-pointer hover:underline">
        {uploading ? "Yükleniyor..." : value ? "Değiştir" : "Görsel Yükle"}
        <input type="file" accept="image/*" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      </label>
      {value && <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">Kaldır</button>}
    </div>
  );
}
