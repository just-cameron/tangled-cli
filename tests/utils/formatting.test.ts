import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate } from '../../src/utils/formatting.js';

describe('formatDate', () => {
  beforeEach(() => {
    // Mock current date to 2024-06-15 12:00:00 UTC for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "today" for current day', () => {
    const today = new Date('2024-06-15T10:00:00.000Z').toISOString();
    expect(formatDate(today)).toBe('today');
  });

  it('should return "yesterday" for previous day', () => {
    const yesterday = new Date('2024-06-14T10:00:00.000Z').toISOString();
    expect(formatDate(yesterday)).toBe('yesterday');
  });

  it('should return days ago for 2-6 days', () => {
    const twoDaysAgo = new Date('2024-06-13T10:00:00.000Z').toISOString();
    expect(formatDate(twoDaysAgo)).toBe('2 days ago');

    const threeDaysAgo = new Date('2024-06-12T10:00:00.000Z').toISOString();
    expect(formatDate(threeDaysAgo)).toBe('3 days ago');

    const sixDaysAgo = new Date('2024-06-09T10:00:00.000Z').toISOString();
    expect(formatDate(sixDaysAgo)).toBe('6 days ago');
  });

  it('should return weeks ago for 7-29 days', () => {
    const oneWeekAgo = new Date('2024-06-08T10:00:00.000Z').toISOString();
    expect(formatDate(oneWeekAgo)).toBe('1 weeks ago');

    const twoWeeksAgo = new Date('2024-06-01T10:00:00.000Z').toISOString();
    expect(formatDate(twoWeeksAgo)).toBe('2 weeks ago');

    const threeWeeksAgo = new Date('2024-05-25T10:00:00.000Z').toISOString();
    expect(formatDate(threeWeeksAgo)).toBe('3 weeks ago');
  });

  it('should return months ago for 30-364 days', () => {
    const oneMonthAgo = new Date('2024-05-16T10:00:00.000Z').toISOString();
    expect(formatDate(oneMonthAgo)).toBe('1 months ago');

    const threeMonthsAgo = new Date('2024-03-16T10:00:00.000Z').toISOString();
    expect(formatDate(threeMonthsAgo)).toBe('3 months ago');

    const sixMonthsAgo = new Date('2023-12-16T10:00:00.000Z').toISOString();
    expect(formatDate(sixMonthsAgo)).toBe('6 months ago');
  });

  it('should return locale date string for 365+ days', () => {
    const oneYearAgo = new Date('2023-06-15T10:00:00.000Z').toISOString();
    const formatted = formatDate(oneYearAgo);

    // The exact format depends on locale, but it should be a date string
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should handle edge case at exactly 7 days', () => {
    const sevenDaysAgo = new Date('2024-06-08T12:00:00.000Z').toISOString();
    expect(formatDate(sevenDaysAgo)).toBe('1 weeks ago');
  });

  it('should handle edge case at exactly 30 days', () => {
    const thirtyDaysAgo = new Date('2024-05-16T12:00:00.000Z').toISOString();
    expect(formatDate(thirtyDaysAgo)).toBe('1 months ago');
  });

  it('should handle edge case at exactly 365 days', () => {
    const oneYearAgo = new Date('2023-06-15T12:00:00.000Z').toISOString();
    const formatted = formatDate(oneYearAgo);

    // Should use locale date string
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
