export function toBengaliNumerals(val: number | string, locale = "bn"): string {
  if (locale !== "bn") return String(val);
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/[0-9]/g, (d) => bengaliDigits[+d]);
}

