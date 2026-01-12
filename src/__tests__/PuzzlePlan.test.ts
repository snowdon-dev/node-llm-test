jest.mock("../domain/characters", () => {
  const originalModule = jest.requireActual("../domain/characters");
  return {
    ...originalModule,
    toBinary: jest.fn((s) => `bin(${s})`),
    rotN: jest.fn((s: string, shift: number) => `${s}_rot${shift}`),
  };
});

import { rotN, toBinary } from "../domain/characters";
import { SymbolRaw } from "../domain/interface";
import { IRandom } from "../domain/IRandom";
import {
  buildSymbolMapper,
  generatePartialTokenized,
} from "../domain/services/PuzzlePlanBuilder";

describe("generatePartialTokenized", () => {
  const blank: string = "[...]";

  const makeRand = (boolValue: boolean): IRandom => ({
    bool: jest.fn().mockReturnValue(boolValue),
    rand: jest.fn(),
    randOrder: jest.fn(),
  });

  it("returns [blankWordToken] if isPartialReason is false", () => {
    const rand = makeRand(false);
    const vals = [["a", "b"]] as SymbolRaw[];

    const result = generatePartialTokenized(
      false, // isPartialReason
      vals,
      0, // tokenRefRemoveIdx
      0, // placementIdx
      0, // dummyIdx
      rand,
    );

    expect(result).toEqual([blank]);
  });

  it("returns [blankWordToken] if activePartial.length === 1", () => {
    const rand = makeRand(true);
    const vals = [["a"]] as SymbolRaw[];

    const result = generatePartialTokenized(true, vals, 0, 0, 0, rand);

    expect(result).toEqual(["a"]);
  });

  it("replaces placementIdx when randomBool returns true", () => {
    const rand = makeRand(true);
    const vals = [
      ["a", "b"], // activePartial
      ["x", "y"], // tmp (dummyIdx)
    ] as SymbolRaw[];

    const result = generatePartialTokenized(
      true,
      vals,
      0, // tokenRefRemoveIdx
      1, // placementIdx
      1, // dummyIdx
      rand,
    );

    expect(result).toEqual(["a", "y"]);
  });

  it("returns single-token array when randomBool returns false", () => {
    const rand = makeRand(false);
    const vals = [
      ["a", "b"], // activePartial
      ["x", "y"], // tmp (dummyIdx)
    ] as SymbolRaw[];

    const result = generatePartialTokenized(true, vals, 0, 1, 1, rand);

    expect(result).toEqual(["y"]);
  });

  it("does not corrupt array when placementIdx is out of bounds", () => {
    const rand = makeRand(true);
    const vals = [
      ["a", "b"],
      ["x", "y"],
    ] as SymbolRaw[];

    const result = generatePartialTokenized(
      true,
      vals,
      0,
      5, // invalid index
      1,
      rand,
    );

    expect(result).toEqual(["a", "b"]);
  });

  it("uses index 0 when dummy token length is 1", () => {
    const rand = makeRand(true);
    const vals = [["a", "b"], ["x"]] as SymbolRaw[];

    const result = generatePartialTokenized(true, vals, 0, 1, 1, rand);

    expect(result).toEqual(["a", "x"]);
  });

  it("does not call rand.bool when activePartial.length === 1", () => {
    const rand = makeRand(true);
    const vals = [["a"]] as SymbolRaw[];

    generatePartialTokenized(true, vals, 0, 0, 0, rand);

    expect(rand.bool).not.toHaveBeenCalled();
  });

  it("uses separate indices for active and dummy tokens", () => {
    const rand = makeRand(true);
    const vals = [
      ["a", "b"],
      ["x", "y"],
      ["m", "n"],
    ] as SymbolRaw[];

    const result = generatePartialTokenized(
      true,
      vals,
      2, // activePartial
      0,
      1, // dummy
      rand,
    );

    expect(result).toEqual(["x", "n"]);
  });
});

describe("buildSymbolMapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns "none" mapper when indirectSymbolsFlag is false (type 0)', () => {
    const rand = jest.fn();
    const result = buildSymbolMapper(rand, false);

    // options should indicate none and mapper should return same input
    expect(result.options).toEqual({ type: "none" });
    const input: SymbolRaw = ["a", "b"];
    expect(result.mapper(input)).toEqual(input);
    // rand should not have been called (no random usage when flag false)
    expect(rand).not.toHaveBeenCalled();
  });

  it("returns rot mapper (type 1) using provided shift", () => {
    // To get type 1: rand(2) must return 0 -> +1 => 1
    // Then rand(24) returns e.g. 3 -> shift = 4
    const rand = jest
      .fn()
      .mockReturnValueOnce(0) // rand(2) -> 0 -> +1 => type 1
      .mockReturnValueOnce(3); // rand(24) -> 3 -> shift = 4

    const result = buildSymbolMapper(rand, true);

    expect(result.options).toEqual({ type: "rot", rotNNum: 4 });

    const input: SymbolRaw = ["x", "y"];
    // mapper should call rotN on each entry with shift 4
    const mapped = result.mapper(input);
    expect(rotN).toHaveBeenCalledTimes(2);
    expect(rotN).toHaveBeenCalledWith("x", 4);
    expect(rotN).toHaveBeenCalledWith("y", 4);
    expect(mapped).toEqual(["x_rot4", "y_rot4"]);
  });

  it("returns binary mapper (type 2)", () => {
    // To get type 2: rand(2) -> 1 -> +1 => 2
    const rand = jest.fn().mockReturnValueOnce(1);
    const result = buildSymbolMapper(rand, true);

    expect(result.options).toEqual({ type: "binary" });

    const input: SymbolRaw = ["hello"];
    const mapped = result.mapper(input);
    expect(toBinary).toHaveBeenCalledTimes(1);
    expect(toBinary).toHaveBeenCalledWith("hello");
    expect(mapped).toEqual(["bin(hello)"]);
  });

  it("returns binaryrot mapper (type 3) combining rotN then toBinary", () => {
    // To get type 3: rand(2) -> 2 -> +1 => 3
    // Then rand(24) returns e.g. 5 -> shift = 6
    const rand = jest
      .fn()
      .mockReturnValueOnce(2) // rand(2) -> 2 -> +1 => 3
      .mockReturnValueOnce(5); // rand(24) -> 5 -> shift = 6

    const result = buildSymbolMapper(rand, true);

    expect(result.options).toEqual({ type: "binaryrot", rotNNum: 6 });

    const input: SymbolRaw = ["A"];
    const mapped = result.mapper(input);

    // ensure rotN called first then toBinary
    expect(rotN).toHaveBeenCalledTimes(1);
    expect(rotN).toHaveBeenCalledWith("A", 6);
    expect(toBinary).toHaveBeenCalledTimes(1);
    // rotN returns 'A_rot6', toBinary returns 'bin(A_rot6)'
    expect(mapped).toEqual(["bin(A_rot6)"]);
  });
});
