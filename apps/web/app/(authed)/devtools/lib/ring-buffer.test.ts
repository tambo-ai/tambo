import { RingBuffer } from "./ring-buffer";

describe("RingBuffer", () => {
  it("stores items up to capacity", () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1).push(2).push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
    expect(buf.length).toBe(3);
    expect(buf.droppedCount).toBe(0);
  });

  it("evicts oldest items when over capacity", () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1).push(2).push(3).push(4).push(5);
    expect(buf.toArray()).toEqual([3, 4, 5]);
    expect(buf.length).toBe(3);
    expect(buf.droppedCount).toBe(2);
  });

  it("returns empty array when no items", () => {
    const buf = new RingBuffer<string>(5);
    expect(buf.toArray()).toEqual([]);
    expect(buf.length).toBe(0);
    expect(buf.droppedCount).toBe(0);
  });

  it("clears the buffer", () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1).push(2).push(3);
    buf.clear();
    expect(buf.toArray()).toEqual([]);
    expect(buf.length).toBe(0);
    expect(buf.droppedCount).toBe(0);
  });

  it("works correctly after clear and re-push", () => {
    const buf = new RingBuffer<number>(2);
    buf.push(1).push(2).push(3);
    buf.clear();
    buf.push(10).push(20);
    expect(buf.toArray()).toEqual([10, 20]);
    expect(buf.droppedCount).toBe(0);
  });

  it("handles wrapping multiple times around", () => {
    const buf = new RingBuffer<number>(2);
    for (let i = 0; i < 100; i++) {
      buf.push(i);
    }
    expect(buf.toArray()).toEqual([98, 99]);
    expect(buf.length).toBe(2);
    expect(buf.droppedCount).toBe(98);
  });
});
