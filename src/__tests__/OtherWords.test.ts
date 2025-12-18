import { extraWords } from "../domain/characters";
import { OtherWordsService } from "../domain/services/OtherWordsService";

function testStructure(list: string[]) {
  list.forEach((word) => {
    expect(typeof word).toBe("string");
    expect(/[a-zA-Z]+/.test(word)).toBeTruthy();
  });
}

describe("OtherWordsService", () => {
  it("works", () => {
    const otherWords = new OtherWordsService({
      chaosWords: false,
      extraWords: false,
    });

    const result = otherWords.build([["three"]], [], ["one", "two"]);
    const arr = Array.from(result);
    expect(arr).toStrictEqual(["three"]);
  });

  it("produces chaosWords", () => {
    const otherWords = new OtherWordsService({
      chaosWords: true,
      extraWords: false,
    });

    const result = otherWords.build([["three"]], [], []);
    const arr = Array.from(result);
    expect(arr).toStrictEqual(["three", "Three"]);
  });

  it("produces chaosWords and input words", () => {
    const otherWords = new OtherWordsService({
      chaosWords: true,
      extraWords: false,
    });

    const result = otherWords.build([["three"]], [], ["one"]);
    const arr = Array.from(result);
    expect(arr).toStrictEqual(["three", "Three", "One"]);
  });

  it("produces chaosWords and active pangrams", () => {
    const otherWords = new OtherWordsService({
      chaosWords: true,
      extraWords: false,
    });

    const result = otherWords.build([["three"]], ["one"], []);
    const arr = Array.from(result);
    expect(arr).toStrictEqual(["three", "Three", "One"]);
  });

  it("produces add extras words", () => {
    const otherWords = new OtherWordsService({
      chaosWords: false,
      extraWords: true,
    });

    const result = otherWords.build([["three"]], [], []);
    const arr = Array.from(result);
    testStructure(arr);
    expect(arr.length).toBe(1 + extraWords.size);
  });

  it("produces add extra chaosWords", () => {
    const otherWords = new OtherWordsService({
      chaosWords: true,
      extraWords: true,
    });

    const result = otherWords.build([[]], [], []);
    const arr = Array.from(result);
    testStructure(arr);
    expect(arr.length).toBe(extraWords.size * 2);
  });
});
