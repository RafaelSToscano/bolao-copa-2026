export function slotLabel(slot: string): string {
  if (!slot) return "A definir";

  const groupMatch = /^([12])([A-L])$/.exec(slot);
  if (groupMatch) return `${groupMatch[1]}º Grupo ${groupMatch[2]}`;

  const thirdComboMatch = /^3\(([A-L]+)\)$/.exec(slot);
  if (thirdComboMatch) {
    const groups = thirdComboMatch[1].split("").join(", ");
    return `Melhor 3º entre os grupos ${groups}`;
  }

  const winnerMatch = /^W(\d+)$/.exec(slot);
  if (winnerMatch) return `Vencedor do Jogo ${winnerMatch[1]}`;

  const loserMatch = /^L(\d+)$/.exec(slot);
  if (loserMatch) return `Perdedor do Jogo ${loserMatch[1]}`;

  return slot;
}
