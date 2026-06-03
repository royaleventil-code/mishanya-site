export function formatPriceAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatShekelPrice(amount: number): string {
  return `${formatPriceAmount(amount)} ₪`;
}

export function hasStartingPrice(programId: string): boolean {
  return programId === "circus";
}

export function formatProgramPriceLabel(programId: string, amount: number): string {
  const price = formatShekelPrice(amount);
  return hasStartingPrice(programId) ? `от ${price}` : price;
}
