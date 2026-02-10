import { V1RunStatus } from "@tambo-ai-cloud/core";
import { operations, type HydraDb } from "@tambo-ai-cloud/db";

// We need to test the actual implementation, not mocks
// This tests the db operations module directly

describe("runs operations", () => {
  describe("markRunCancelled", () => {
    it("should set status to IDLE, isCancelled to true, and completedAt", async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

      const mockDb = {
        update: mockUpdate,
      } as unknown as HydraDb;

      await operations.markRunCancelled(mockDb, "run_123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledTimes(1);

      // Verify the set() call includes status: IDLE and isCancelled: true
      const setArg = mockSet.mock.calls[0][0] as Record<string, unknown>;
      expect(setArg.status).toBe(V1RunStatus.IDLE);
      expect(setArg.isCancelled).toBe(true);
      expect(setArg.completedAt).toBeInstanceOf(Date);
      expect(setArg.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("markMessageCancelled", () => {
    it("should set isCancelled to true for the specified message", async () => {
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

      const mockDb = {
        update: mockUpdate,
      } as unknown as HydraDb;

      await operations.markMessageCancelled(mockDb, "msg_123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledTimes(1);

      // Verify set() was called with isCancelled: true
      const setArg = mockSet.mock.calls[0][0] as Record<string, unknown>;
      expect(setArg.isCancelled).toBe(true);
    });
  });
});
