/** Counts the character bigrams of a string. */
function bigrams(value: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let index = 0; index < value.length - 1; index += 1) {
    const gram = value.slice(index, index + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

/** Sørensen–Dice similarity of two strings over their character bigrams, from 0 to 1. */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  if (a.length < 2 || b.length < 2) {
    return 0;
  }

  const left = bigrams(a);
  const right = bigrams(b);
  let shared = 0;
  for (const [gram, count] of left) {
    shared += Math.min(count, right.get(gram) ?? 0);
  }

  return (2 * shared) / (a.length - 1 + (b.length - 1));
}
