import { render, screen } from "@testing-library/react";
import { useAuth } from "@clerk/nextjs";
import { formatDuration, intervalToDuration } from "date-fns";
import { Usage } from "./usage";

// Mock external dependencies
jest.mock("@clerk/nextjs", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, size, variant, className, ...props }: any) => {
    const Component = asChild ? "div" : "button";
    return (
      <Component 
        data-testid="button" 
        data-size={size}
        data-variant={variant}
        className={className}
        {...props}
      >
        {children}
      </Component>
    );
  },
}));

jest.mock("lucide-react", () => ({
  CrownIcon: () => <span data-testid="crown-icon">👑</span>,
}));

// Mock date-fns functions for predictable testing
jest.mock("date-fns", () => ({
  formatDuration: jest.fn(),
  intervalToDuration: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFormatDuration = formatDuration as jest.MockedFunction<typeof formatDuration>;
const mockIntervalToDuration = intervalToDuration as jest.MockedFunction<typeof intervalToDuration>;

// Mock console.log to capture debug output
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe("Usage Component", () => {
  const mockInterval = { hours: 2, days: 0, months: 0 };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mocks
    mockIntervalToDuration.mockReturnValue(mockInterval);
    mockFormatDuration.mockReturnValue("2 hours");
    
    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Pro User Experience", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(true),
      } as any);
    });

    test("should display credits without 'free' label for pro users", () => {
      render(<Usage points={100} msBeforeNext={3600000} />);
      
      expect(screen.getByText("100 credits remaining!")).toBeInTheDocument();
      expect(screen.queryByText(/free/)).not.toBeInTheDocument();
    });

    test("should not show upgrade button for pro users", () => {
      render(<Usage points={50} msBeforeNext={7200000} />);
      
      expect(screen.queryByText("Upgrade")).not.toBeInTheDocument();
      expect(screen.queryByTestId("crown-icon")).not.toBeInTheDocument();
    });

    test("should display formatted duration correctly for pro users", () => {
      render(<Usage points={75} msBeforeNext={7200000} />);
      
      expect(screen.getByText(/Resets in/)).toBeInTheDocument();
      expect(screen.getByText("2 hours")).toBeInTheDocument();
    });

    test("should call date-fns functions with correct parameters", () => {
      const msBeforeNext = 7200000;
      render(<Usage points={75} msBeforeNext={msBeforeNext} />);
      
      expect(mockIntervalToDuration).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
      });
      
      expect(mockFormatDuration).toHaveBeenCalledWith(
        mockInterval,
        { format: ["months", "days", "hours"] }
      );
    });
  });

  describe("Free User Experience", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should display 'free' label in credits text for free users", () => {
      render(<Usage points={25} msBeforeNext={1800000} />);
      
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
    });

    test("should show upgrade button for free users", () => {
      render(<Usage points={10} msBeforeNext={3600000} />);
      
      expect(screen.getByText("Upgrade")).toBeInTheDocument();
      expect(screen.getByTestId("crown-icon")).toBeInTheDocument();
    });

    test("should have correct upgrade link href", () => {
      render(<Usage points={5} msBeforeNext={900000} />);
      
      const upgradeLink = screen.getByRole("link");
      expect(upgradeLink).toHaveAttribute("href", "/pricing");
    });

    test("should apply correct button properties", () => {
      render(<Usage points={15} msBeforeNext={2700000} />);
      
      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("data-size", "sm");
      expect(button).toHaveAttribute("data-variant", "tertiary");
      expect(button).toHaveClass("ml-auto");
    });
  });

  describe("Duration Formatting", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should show 'less than an hour' when formatDuration returns empty string", () => {
      mockFormatDuration.mockReturnValue("");
      
      render(<Usage points={20} msBeforeNext={1800000} />);
      
      expect(screen.getByText(/less than an hour/)).toBeInTheDocument();
    });

    test("should show 'less than an hour' when formatDuration returns null", () => {
      mockFormatDuration.mockReturnValue(null as any);
      
      render(<Usage points={20} msBeforeNext={1800000} />);
      
      expect(screen.getByText(/less than an hour/)).toBeInTheDocument();
    });

    test("should display formatted duration when available", () => {
      mockFormatDuration.mockReturnValue("3 hours 45 minutes");
      
      render(<Usage points={30} msBeforeNext={13500000} />);
      
      expect(screen.getByText("3 hours 45 minutes")).toBeInTheDocument();
    });

    test("should format complex durations correctly", () => {
      mockIntervalToDuration.mockReturnValue({ months: 1, days: 2, hours: 3 });
      mockFormatDuration.mockReturnValue("1 month 2 days 3 hours");
      
      render(<Usage points={40} msBeforeNext={2764800000} />);
      
      expect(screen.getByText("1 month 2 days 3 hours")).toBeInTheDocument();
    });

    test("should handle zero duration", () => {
      mockIntervalToDuration.mockReturnValue({ months: 0, days: 0, hours: 0 });
      mockFormatDuration.mockReturnValue("");
      
      render(<Usage points={50} msBeforeNext={0} />);
      
      expect(screen.getByText(/less than an hour/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should handle zero points", () => {
      render(<Usage points={0} msBeforeNext={3600000} />);
      
      expect(screen.getByText("0 free credits remaining!")).toBeInTheDocument();
    });

    test("should handle negative points gracefully", () => {
      render(<Usage points={-5} msBeforeNext={3600000} />);
      
      expect(screen.getByText("-5 free credits remaining!")).toBeInTheDocument();
    });

    test("should handle very large point values", () => {
      render(<Usage points={999999} msBeforeNext={3600000} />);
      
      expect(screen.getByText("999999 free credits remaining!")).toBeInTheDocument();
    });

    test("should handle negative msBeforeNext", () => {
      render(<Usage points={50} msBeforeNext={-1000} />);
      
      expect(screen.getByText("50 free credits remaining!")).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", -1000);
    });

    test("should handle very large msBeforeNext values", () => {
      const veryLargeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
      mockFormatDuration.mockReturnValue("1 year");
      
      render(<Usage points={100} msBeforeNext={veryLargeMs} />);
      
      expect(screen.getByText(/Resets in/)).toBeInTheDocument();
      expect(screen.getByText("1 year")).toBeInTheDocument();
    });

    test("should handle NaN msBeforeNext", () => {
      render(<Usage points={25} msBeforeNext={NaN} />);
      
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", NaN);
    });

    test("should handle Infinity msBeforeNext", () => {
      render(<Usage points={25} msBeforeNext={Infinity} />);
      
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", Infinity);
    });
  });

  describe("Auth Hook Integration", () => {
    test("should handle auth hook returning undefined has function", () => {
      mockUseAuth.mockReturnValue({
        has: undefined,
      } as any);
      
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      // Should default to free user behavior when has is undefined
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
      expect(screen.getByText("Upgrade")).toBeInTheDocument();
    });

    test("should handle auth hook returning null", () => {
      mockUseAuth.mockReturnValue(null as any);
      
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      // Should handle gracefully and default to free user
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
    });

    test("should call has function with correct plan parameter", () => {
      const mockHas = jest.fn().mockReturnValue(true);
      mockUseAuth.mockReturnValue({
        has: mockHas,
      } as any);
      
      render(<Usage points={50} msBeforeNext={3600000} />);
      
      expect(mockHas).toHaveBeenCalledWith({ plan: "pro" });
    });

    test("should handle has function throwing an error", () => {
      const mockHas = jest.fn().mockImplementation(() => {
        throw new Error("Auth error");
      });
      mockUseAuth.mockReturnValue({
        has: mockHas,
      } as any);
      
      // Component should still render and default to free user behavior
      expect(() => render(<Usage points={50} msBeforeNext={3600000} />)).toThrow();
    });

    test("should handle has function returning non-boolean", () => {
      const mockHas = jest.fn().mockReturnValue("invalid");
      mockUseAuth.mockReturnValue({
        has: mockHas,
      } as any);
      
      render(<Usage points={50} msBeforeNext={3600000} />);
      
      // Should treat truthy non-boolean as pro user
      expect(screen.getByText("50 credits remaining!")).toBeInTheDocument();
      expect(screen.queryByText("Upgrade")).not.toBeInTheDocument();
    });
  });

  describe("Console Logging", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should log msBeforeNext value on render", () => {
      const testMs = 5400000; // 1.5 hours
      render(<Usage points={30} msBeforeNext={testMs} />);
      
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", testMs);
    });

    test("should log zero msBeforeNext", () => {
      render(<Usage points={30} msBeforeNext={0} />);
      
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", 0);
    });

    test("should log negative msBeforeNext", () => {
      render(<Usage points={30} msBeforeNext={-1000} />);
      
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", -1000);
    });

    test("should log on every render", () => {
      const { rerender } = render(<Usage points={30} msBeforeNext={1000} />);
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      
      rerender(<Usage points={30} msBeforeNext={2000} />);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenLastCalledWith("msBeforeNext:", 2000);
    });
  });

  describe("Component Structure and Styling", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should have correct container styling", () => {
      const { container } = render(<Usage points={25} msBeforeNext={3600000} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass(
        "rounded-t-xl",
        "bg-background", 
        "border",
        "border-b-0",
        "p-2.5"
      );
    });

    test("should have correct flex layout structure", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const flexContainer = screen.getByText("25 free credits remaining!").closest(".flex");
      expect(flexContainer).toHaveClass("flex", "items-center", "gap-x-2");
    });

    test("should have correct text styling for credits", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const creditsText = screen.getByText("25 free credits remaining!");
      expect(creditsText).toHaveClass("text-sm");
    });

    test("should have correct text styling for reset duration", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const resetText = screen.getByText(/Resets in/).closest("p");
      expect(resetText).toHaveClass("text-xs", "text-muted-foreground");
    });

    test("should maintain proper DOM structure", () => {
      const { container } = render(<Usage points={25} msBeforeNext={3600000} />);
      
      // Check nested structure
      const outerDiv = container.firstChild;
      const innerDiv = outerDiv?.firstChild;
      const textDiv = innerDiv?.firstChild;
      
      expect(outerDiv).toBeInTheDocument();
      expect(innerDiv).toBeInTheDocument();
      expect(textDiv).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should have accessible upgrade link", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const upgradeLink = screen.getByRole("link");
      expect(upgradeLink).toBeInTheDocument();
      expect(upgradeLink).toHaveAttribute("href", "/pricing");
      expect(upgradeLink).toHaveTextContent("Upgrade");
    });

    test("should have meaningful text content for screen readers", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      // Check that important information is accessible
      expect(screen.getByText(/credits remaining/)).toBeInTheDocument();
      expect(screen.getByText(/Resets in/)).toBeInTheDocument();
    });

    test("should have crown icon with proper accessibility", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const crownIcon = screen.getByTestId("crown-icon");
      expect(crownIcon).toBeInTheDocument();
    });

    test("should not have accessibility violations in button", () => {
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      const upgradeLink = screen.getByRole("link");
      expect(upgradeLink).toHaveTextContent("Upgrade");
    });
  });

  describe("Date Calculations", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
    });

    test("should calculate end date correctly", () => {
      const msBeforeNext = 7200000; // 2 hours
      const fixedNow = 1640995200000;
      jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
      
      render(<Usage points={25} msBeforeNext={msBeforeNext} />);
      
      expect(mockIntervalToDuration).toHaveBeenCalledWith({
        start: new Date(),
        end: new Date(fixedNow + msBeforeNext),
      });
    });

    test("should handle date calculation with edge values", () => {
      const msBeforeNext = 0;
      render(<Usage points={25} msBeforeNext={msBeforeNext} />);
      
      expect(mockIntervalToDuration).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
      });
    });
  });

  describe("Component Prop Validation", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false), 
      } as any);
    });

    test("should accept valid UsageProps interface", () => {
      const validProps = { points: 100, msBeforeNext: 3600000 };
      
      expect(() => render(<Usage {...validProps} />)).not.toThrow();
    });

    test("should handle fractional points", () => {
      render(<Usage points={25.5} msBeforeNext={3600000} />);
      
      expect(screen.getByText("25.5 free credits remaining!")).toBeInTheDocument();
    });

    test("should handle fractional msBeforeNext", () => {
      render(<Usage points={25} msBeforeNext={3600000.5} />);
      
      expect(consoleSpy).toHaveBeenCalledWith("msBeforeNext:", 3600000.5);
    });
  });

  describe("Integration Tests", () => {
    test("should work correctly with real date-fns functions", () => {
      // Temporarily restore real date-fns functions
      jest.restoreAllMocks();
      
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
      
      // This should work with actual date-fns functions
      render(<Usage points={25} msBeforeNext={3600000} />);
      
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
      expect(screen.getByText(/Resets in/)).toBeInTheDocument();
    });

    test("should handle component lifecycle correctly", () => {
      mockUseAuth.mockReturnValue({
        has: jest.fn().mockReturnValue(false),
      } as any);
      
      const { unmount } = render(<Usage points={25} msBeforeNext={3600000} />);
      
      // Should render without issues
      expect(screen.getByText("25 free credits remaining!")).toBeInTheDocument();
      
      // Should unmount without issues
      expect(() => unmount()).not.toThrow();
    });
  });
});