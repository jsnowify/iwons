import type { Review } from "./types";
export const intervals = [1, 3, 7, 14, 30];
export type Rating = "Again" | "Hard" | "Good" | "Easy";
export function rateReview(
  review: Review,
  rating: Rating,
  now = Date.now(),
): Review {
  const step =
    rating === "Again"
      ? 0
      : rating === "Hard"
        ? Math.max(0, review.step)
        : Math.min(4, review.step + (rating === "Easy" ? 2 : 1));
  return {
    ...review,
    step,
    due: now + intervals[step] * 86400000,
    lastRating: rating,
  };
}
