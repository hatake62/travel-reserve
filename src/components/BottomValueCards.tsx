const cards = [
  {
    title: "お気に入りに追加",
    description: "気になるホテルを保存して、いつでもチェックできます",
  },
  {
    title: "価格推移を追跡",
    description: "お気に入りのホテルの価格変動を毎日自動で記録します",
  },
  {
    title: "ベストなタイミングで予約",
    description: "価格が下がったタイミングを見つけて、お得に予約できます",
  },
];

export default function BottomValueCards() {
  return (
    <section
      aria-labelledby="about"
      className="mt-12 grid gap-4 border-t border-slate-200 pt-8 md:grid-cols-3"
      id="about"
    >
      {cards.map((card, index) => (
        <article
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          key={card.title}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
            {index + 1}
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-950">{card.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
        </article>
      ))}
    </section>
  );
}
