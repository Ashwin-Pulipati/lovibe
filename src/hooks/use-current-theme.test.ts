import { renderHook } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { useCurrentTheme } from './use-current-theme';

// Mock next-themes
jest.mock('next-themes');

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('useCurrentTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when theme is explicitly set to "dark"', () => {
    it('should return "dark"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should return "dark" regardless of systemTheme value', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
      expect(result.current).not.toBe('light');
    });
  });

  describe('when theme is explicitly set to "light"', () => {
    it('should return "light"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should return "light" regardless of systemTheme value', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
      expect(result.current).not.toBe('dark');
    });
  });

  describe('when theme is set to "system"', () => {
    it('should return systemTheme when systemTheme is "dark"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should return systemTheme when systemTheme is "light"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should return systemTheme when it is undefined', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: undefined,
        setTheme: jest.fn(),
        resolvedTheme: undefined,
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBeUndefined();
    });
  });

  describe('when theme is undefined', () => {
    it('should return systemTheme when systemTheme is "dark"', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should return systemTheme when systemTheme is "light"', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should return undefined when both theme and systemTheme are undefined', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        systemTheme: undefined,
        setTheme: jest.fn(),
        resolvedTheme: undefined,
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBeUndefined();
    });
  });

  describe('when theme is a custom value', () => {
    it('should return systemTheme when theme is "auto"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'auto',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'auto'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should return systemTheme when theme is "custom-theme"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'custom-theme',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'custom-theme'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should return systemTheme when theme is an empty string', () => {
      mockUseTheme.mockReturnValue({
        theme: '',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should return systemTheme when theme is a number (edge case)', () => {
      mockUseTheme.mockReturnValue({
        theme: 123 as any,
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle when useTheme returns null values', () => {
      mockUseTheme.mockReturnValue({
        theme: null as any,
        systemTheme: null as any,
        setTheme: jest.fn(),
        resolvedTheme: null as any,
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBeNull();
    });

    it('should handle boolean theme values', () => {
      mockUseTheme.mockReturnValue({
        theme: false as any,
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should handle object theme values', () => {
      mockUseTheme.mockReturnValue({
        theme: {} as any,
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should handle when systemTheme is null but theme requires fallback', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: null as any,
        setTheme: jest.fn(),
        resolvedTheme: null as any,
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBeNull();
    });
  });

  describe('theme priority logic', () => {
    it('should prioritize explicit "dark" theme over dark systemTheme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('dark');
    });

    it('should prioritize explicit "light" theme over light systemTheme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });

    it('should use systemTheme when theme is neither "dark" nor "light"', () => {
      mockUseTheme.mockReturnValue({
        theme: 'unknown',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'unknown'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');
    });
  });

  describe('behavior consistency and reactivity', () => {
    it('should return the same value on multiple calls with same input', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result, rerender } = renderHook(() => useCurrentTheme());
      const firstResult = result.current;
      
      rerender();
      const secondResult = result.current;
      
      expect(firstResult).toBe('dark');
      expect(secondResult).toBe('dark');
      expect(firstResult).toBe(secondResult);
    });

    it('should react to changes in theme from explicit to system', () => {
      // Initial state - explicit theme
      mockUseTheme.mockReturnValue({
        theme: 'light',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result, rerender } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');

      // Change to system theme
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      rerender();
      expect(result.current).toBe('dark');
    });

    it('should react to changes in systemTheme when theme is not explicit', () => {
      // Initial state
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      const { result, rerender } = renderHook(() => useCurrentTheme());
      expect(result.current).toBe('light');

      // System theme changes
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      rerender();
      expect(result.current).toBe('dark');
    });
  });

  describe('type safety and return value validation', () => {
    it('should handle string type theme values correctly', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark' as string,
        systemTheme: 'light' as string,
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(typeof result.current).toBe('string');
      expect(result.current).toBe('dark');
    });

    it('should return string or undefined type', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        systemTheme: undefined,
        setTheme: jest.fn(),
        resolvedTheme: undefined,
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      const { result } = renderHook(() => useCurrentTheme());
      expect(result.current).toBeUndefined();
      expect(typeof result.current === 'string' || result.current === undefined).toBe(true);
    });
  });

  describe('function behavior specifications', () => {
    it('should call useTheme exactly once per render', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      });

      renderHook(() => useCurrentTheme());
      expect(mockUseTheme).toHaveBeenCalledTimes(1);
    });

    it('should not modify the returned values from useTheme', () => {
      const originalReturn = {
        theme: 'dark',
        systemTheme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        forcedTheme: undefined,
      };

      mockUseTheme.mockReturnValue(originalReturn);
      renderHook(() => useCurrentTheme());

      expect(mockUseTheme).toHaveReturnedWith(originalReturn);
    });
  });
});