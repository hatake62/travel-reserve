type MapPlaceholderProps = {
  areaName: string;
  hotelCount: number;
};

export default function MapPlaceholder({ areaName, hotelCount }: MapPlaceholderProps) {
  return (
    <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative min-h-[360px] bg-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#e2e8f0_1px,transparent_1px),linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute left-8 top-10 h-24 w-32 rounded-[40%] bg-sky-200/70" />
        <div className="absolute bottom-12 right-10 h-28 w-36 rounded-[45%] bg-emerald-200/70" />
        <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-700 text-sm font-black text-white shadow-lg">
          地図
        </div>
      </div>
      <div className="p-5">
        <p className="text-lg font-bold text-slate-950">地図表示</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          今後、ホテル位置を地図で表示予定です。現在は検索エリアと表示件数の確認用プレースホルダーです。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">検索エリア</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">{areaName || "未指定"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">表示中</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{hotelCount}件</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
