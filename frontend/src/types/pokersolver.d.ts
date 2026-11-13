declare module 'pokersolver' {
  export class Hand {
    name: string;
    descr: string;
    rank: number;
    compare(other: Hand): number;
    static solve(cards: string[]): Hand;
    static winners(hands: Hand[]): Hand[];
  }
}
