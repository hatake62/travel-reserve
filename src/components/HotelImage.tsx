"use client";

import { useState } from "react";

type HotelImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  variant?: "card" | "detail";
};

export default function HotelImage({
  src,
  alt,
  className = "",
  variant = "card",
}: HotelImageProps) {
  const normalizedSrc = src?.trim() || "";
  const [failedSrc, setFailedSrc] = useState("");

  const heightClassName = variant === "detail" ? "h-64 sm:h-96" : "h-48";
  const shouldShowImage = normalizedSrc && failedSrc !== normalizedSrc;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${heightClassName} ${className}`}
    >
      {shouldShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className="h-full w-full object-cover"
          loading={variant === "card" ? "lazy" : "eager"}
          onError={() => setFailedSrc(normalizedSrc)}
          src={normalizedSrc}
        />
      ) : (
        <div
          aria-label={`${alt}（画像なし）`}
          className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_55%,#cbd5e1_100%)] px-6 text-center"
          role="img"
        >
          <div className="max-w-xs">
            <div
              aria-hidden="true"
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/75 text-3xl shadow-sm ring-1 ring-slate-200"
            >
              🏨
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">画像なし</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
