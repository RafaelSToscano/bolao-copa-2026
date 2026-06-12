export const MOCK_NOW: number = process.env.NEXT_PUBLIC_MOCK_NOW
  ? Date.parse(process.env.NEXT_PUBLIC_MOCK_NOW)
  : Date.now();
