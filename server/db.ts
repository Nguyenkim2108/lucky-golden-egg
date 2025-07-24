// Mock implementation của database
import * as schema from "@shared/schema";

// Mock Pool không thực sự kết nối đến DB
class MockPool {
  async query() {
    console.log("Mock database query called");
    return { rows: [] };
  }
}

// Mock DB với các phương thức trả về dữ liệu trống
const mockDb = {
  query: () => {
    console.log("Mock db.query called");
    return Promise.resolve({ rows: [] });
  },
  select: () => mockDb,
  from: () => mockDb,
  where: () => mockDb,
  execute: () => Promise.resolve([]),
  insert: () => mockDb,
  values: () => mockDb,
  returning: () => Promise.resolve([]),
};

export const pool = new MockPool();
export const db = mockDb;