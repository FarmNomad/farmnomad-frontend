export default function ScrollingMarquee() {
  const text =
    "✽ Agriculture ✽ Farming ✽ Organic ✽ Vegetables ✽ Fruits ✽ Fresh ✽ Agriculture ✽ Farming ✽ Organic ✽ Vegetables ✽ Fruits ✽ Fresh";

  return (
    <div className="relative overflow-hidden border-y border-green-200 bg-[#f9f8f3] py-3">
      <div className="flex w-max animate-marquee gap-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-1 whitespace-nowrap text-3xl">
            {text.split("").map((char, idx) => (
              <span key={idx} className="stroke-text">
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
