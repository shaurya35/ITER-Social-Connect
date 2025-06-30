// Simple in-memory store
const pingHistory = [];

export const addPingRecord = (record) => {
  pingHistory.push(record);
  if (pingHistory.length > 100) pingHistory.shift();
};

export const getPingHistory = () => {
  return [...pingHistory].reverse();
};