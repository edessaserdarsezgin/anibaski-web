"use client";

import Image from "next/image";

type Props = {
  templateUrl: string;
  photoUrl: string;
  className?: string;
};

export default function ProductMockup({ templateUrl, photoUrl, className = "" }: Props) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Şablon görüntüsü konteynerin yüksekliğini ve oranını belirliyor */}
      {/* next/image DEĞİL: şablon ve kullanıcı fotoğrafı üst üste bindirilip ölçü referansı
          olarak kullanılıyor; ayrıca foto blob:/geçici URL olabiliyor — Image sarmalayıcısı
          hem oranı bozuyor hem blob'u desteklemiyor. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={templateUrl} alt="" className="w-full h-auto invisible" aria-hidden />
      {/* Kullanıcı fotoğrafı arkada */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt="Fotoğraf önizleme"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Şablon (çerçeve) önde */}
      <Image
        src={templateUrl}
        alt=""
        fill
        className="object-fill pointer-events-none"
        sizes="600px"
        aria-hidden
        unoptimized
      />
    </div>
  );
}
