import { TESTIMONIALS, type Testimonial } from "@/data/catalog";

/**
 * Mijozlar fikri uchun tartiblash qoidalari.
 *
 * Landing'dagi lenta **bitta qator**: barcha fikrlar bir marta to'liq o'tib
 * chiqadi, keyin yana boshidan aylanadi. Shuning uchun tartib shunday
 * tuziladiki, bitta aylanishda ham eng yuqori bahoga ega fikrlar, ham eng
 * yangi taassurotlar ko'rinadi.
 */

/** Sharhning umumiy bahosi (reyting ustuvor, keyin tasdiqlar va matn hajmi). */
export function reviewScore(review: Testimonial, liveLikes = 0): number {
  const likes = review.likes + liveLikes;
  return review.rating * 20 + likes * 0.6 + Math.min(review.text.length, 400) / 100;
}

export type ReviewRanks = {
  /** Eng yaxshi fikrlar tartibi (0 — eng yuqori ball). */
  scoreRank: Map<string, number>;
  /** Eng yangi fikrlar tartibi (0 — eng oxirgi qo'shilgan). */
  newRank: Map<string, number>;
};

/** Har bir fikrning ikkala reytingdagi o'rni — kartochkadagi nishon uchun. */
export function reviewRanks(
  pool: Testimonial[] = TESTIMONIALS,
  likesById: Record<string, number> = {},
): ReviewRanks {
  const byScore = [...pool].sort(
    (a, b) => reviewScore(b, likesById[b.id] ?? 0) - reviewScore(a, likesById[a.id] ?? 0),
  );
  const byNew = [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    scoreRank: new Map(byScore.map((review, index) => [review.id, index])),
    newRank: new Map(byNew.map((review, index) => [review.id, index])),
  };
}

/**
 * Bitta aylanma uchun tayyor tartib.
 *
 * `top` va `yangi` ro'yxatlarni navbatma-navbat aralashtiradi
 * (`top1, yangi1, top2, yangi2, …`), qolganlarini oxiriga qo'shadi — shu bilan
 * lentada ham sifatli, ham yangi fikrlar bir tekis ko'rinadi va **hamma
 * kartochka to'liq o'tib chiqadi**.
 */
export function reviewFeed(
  pool: Testimonial[] = TESTIMONIALS,
  likesById: Record<string, number> = {},
): Testimonial[] {
  const byScore = [...pool].sort(
    (a, b) => reviewScore(b, likesById[b.id] ?? 0) - reviewScore(a, likesById[a.id] ?? 0),
  );
  const byNew = [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const feed: Testimonial[] = [];
  const used = new Set<string>();
  for (let index = 0; index < pool.length; index += 1) {
    for (const candidate of [byScore[index], byNew[index]]) {
      if (candidate && !used.has(candidate.id)) {
        used.add(candidate.id);
        feed.push(candidate);
      }
    }
  }
  // Xavfsizlik uchun: biror sabab bilan tushmay qolganlar bo'lsa qo'shamiz.
  for (const review of byScore) {
    if (!used.has(review.id)) feed.push(review);
  }
  return feed;
}
