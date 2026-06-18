"use client";

type Props = {
  bgColor: string;
  textColor: string;
  onBgChange: (color: string) => void;
  onTextChange: (color: string) => void;
  size?: "sm" | "md";
};

export default function ColorPairPicker({ bgColor, textColor, onBgChange, onTextChange, size = "md" }: Props) {
  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const cls = `${dim} rounded-lg border border-border cursor-pointer p-0.5 bg-white`;
  return (
    <>
      <div className="flex flex-col gap-0.5 items-center shrink-0">
        <span className="text-[10px] text-text-light">Arka</span>
        <input type="color" value={bgColor} onChange={e => onBgChange(e.target.value)} className={cls} />
      </div>
      <div className="flex flex-col gap-0.5 items-center shrink-0">
        <span className="text-[10px] text-text-light">Yazı</span>
        <input type="color" value={textColor} onChange={e => onTextChange(e.target.value)} className={cls} />
      </div>
    </>
  );
}
