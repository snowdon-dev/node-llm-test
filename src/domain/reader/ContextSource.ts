import { PuzzleContext } from "../models/PuzzleContext";
import { IContextSource, SymbolMutable } from "./interface";

enum BucketType {
  OTHER = "other",
  ACTIVE = "active",
  CHOSEN = "chosen",
}

export class ContextSource implements IContextSource {
  private static readonly TYPES = BucketType;

  private currentIndex = 0;
  private currentBucketIndex = 0;
  private currentBucket: readonly string[] | undefined;
  private readonly buckets: (readonly string[])[];
  private readonly bucketIds: string[];

  constructor(private readonly ctx: PuzzleContext) {
    //if (ctx.totalWords.length < 3) throw new TypeError("not enough words");
    this.buckets = [];
    this.bucketIds = [];

    this.addBucket(ctx.otherWords, ContextSource.TYPES.OTHER);
    this.addBucket(ctx.active, ContextSource.TYPES.ACTIVE);
    this.addBucket(ctx.chosen, ContextSource.TYPES.CHOSEN);

    this.currentBucket = this.buckets[0];
  }

  peek(offset: number): string | null {
    if (!this.currentBucket) return null;
    const idx = this.currentIndex + offset + 1;
    return this.isWithinCurrentBucket(idx) ? this.currentBucket[idx] : null;
  }

  isBucket(type: string): boolean {
    return (
      this.bucketIds[this.currentBucketIndex] === type && !!this.currentBucket
    );
  }

  next(steps: number): boolean {
    this.currentIndex += steps;

    if (this.isWithinCurrentBucket(this.currentIndex)) {
      return true;
    }

    return this.advanceToNextBucket();
  }

  read(count: number): SymbolMutable {
    if (!this.currentBucket) {
      throw new Error("No bucket available to read from.");
    }

    const slice = this.currentBucket.slice(
      this.currentIndex,
      Math.min(this.currentIndex + count, this.currentBucket.length),
    );

    if (slice.length > 2) {
      throw new Error(
        `Read length exceeded: attempted to read ${slice.length} items`,
      );
    }

    return slice as SymbolMutable;
  }

  atAll(idx: number): string {
    return this.ctx.totalWords[idx];
  }

  randNot(idx: number, words: string[] | null): string {
    const { totalWords } = this.ctx;
    if (words !== null && words.includes(totalWords[idx])) {
      idx = (idx + 1) % totalWords.length;
      if (words.includes(totalWords[idx])) idx = (idx + 1) % totalWords.length;
    }
    return this.atAll(idx);
  }

  all(): string[] {
    return this.ctx.totalWords;
  }

  private addBucket(words: readonly string[] | undefined, id: string): void {
    if (words && words.length > 0) {
      this.buckets.push(words);
      this.bucketIds.push(id);
    }
  }

  private isWithinCurrentBucket(index: number): boolean {
    return !!this.currentBucket && index < this.currentBucket.length;
  }

  private advanceToNextBucket(): false {
    this.currentBucketIndex++;
    this.currentIndex = 0;
    this.currentBucket = this.buckets[this.currentBucketIndex];
    return false;
  }
}
