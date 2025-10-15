/**
 * Returns the appropriate seasonal icon based on the current month
 * @returns string - The emoji icon for the current season/month
 */
export function getSeasonalIcon(): string {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1 for 1-12
  
  switch (currentMonth) {
    case 10: // October
      return '🎃'; // Pumpkin
    case 11: // November  
      return '🦃'; // Turkey
    case 12: // December
      return '🎄'; // Christmas Tree
    default:
      return '⚔️'; // Crossed swords for all other months
  }
}
