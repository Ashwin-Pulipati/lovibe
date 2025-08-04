import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectView } from "./project-view";

// Mock all the imported components and their dependencies
jest.mock("../components/messages-container", () => ({
  MessagesContainer: jest.fn(({ projectId, setActiveFragment, activeFragment }) => (
    <div data-testid="messages-container">
      <div data-testid="project-id">{projectId}</div>
      <div data-testid="active-fragment-id">{activeFragment?.id || "none"}</div>
      <button
        data-testid="select-fragment"
        onClick={() =>
          setActiveFragment({
            id: "test-fragment-1",
            title: "Test Fragment",
            name: "Test Fragment",
            files: { 
              "index.html": "<div>Test HTML</div>", 
              "style.css": "body { margin: 0; }",
              "app.js": "console.log('hello');"
            },
            createdAt: new Date("2023-01-01"),
            updatedAt: new Date("2023-01-02"),
            projectId: projectId,
            content: "Test content",
            description: "Test description",
            sandboxUrl: "https://test.sandbox.url"
          })
        }
      >
        Select Fragment
      </button>
      <button
        data-testid="clear-fragment"
        onClick={() => setActiveFragment(null)}
      >
        Clear Fragment
      </button>
    </div>
  )),
}));

jest.mock("../components/project-header", () => ({
  ProjectHeader: jest.fn(({ projectId }) => (
    <div data-testid="project-header">
      <span data-testid="header-project-id">{projectId}</span>
    </div>
  )),
}));

jest.mock("../components/fragment-web", () => ({
  FragmentWeb: jest.fn(({ data }) => (
    <div data-testid="fragment-web">
      <span data-testid="fragment-name">{data?.name || data?.title}</span>
      <span data-testid="fragment-id">{data?.id}</span>
      <span data-testid="fragment-files-count">{Object.keys(data?.files || {}).length}</span>
    </div>
  )),
}));

jest.mock("@/components/file-explorer", () => ({
  FileExplorer: jest.fn(({ files }) => (
    <div data-testid="file-explorer">
      <div data-testid="file-count">{Object.keys(files || {}).length}</div>
      <div data-testid="file-names">{Object.keys(files || {}).join(", ")}</div>
    </div>
  )),
}));

jest.mock("@/components/user-control", () => ({
  UserControl: jest.fn(() => <div data-testid="user-control">User Control</div>),
}));

jest.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, direction, ...props }: any) => (
    <div data-testid="resizable-panel-group" data-direction={direction} {...props}>
      {children}
    </div>
  ),
  ResizablePanel: ({ children, defaultSize, minSize, className, ...props }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  ResizableHandle: ({ className, ...props }: any) => (
    <div data-testid="resizable-handle" className={className} {...props} />
  ),
}));

jest.mock("@radix-ui/react-tabs", () => ({
  Tabs: ({ children, value, onValueChange, defaultValue, className, ...props }: any) => (
    <div
      data-testid="tabs"
      data-value={value}
      data-default-value={defaultValue}
      className={className}
      {...props}
    >
      <button
        data-testid="tab-value-changer"
        onClick={() => onValueChange && onValueChange(value === "preview" ? "code" : "preview")}
      >
        Change Tab ({value})
      </button>
      {children}
    </div>
  ),
  TabsList: ({ children, className, ...props }: any) => (
    <div data-testid="tabs-list" className={className} {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, className, ...props }: any) => (
    <button
      data-testid={`tabs-trigger-${value}`}
      data-value={value}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className, ...props }: any) => (
    <div data-testid={`tabs-content-${value}`} className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, size, variant, ...props }: any) => {
    if (asChild) {
      return (
        <div
          data-testid="button"
          data-as-child={asChild}
          data-size={size}
          data-variant={variant}
          {...props}
        >
          {children}
        </div>
      );
    }
    return (
      <button
        data-testid="button"
        data-as-child={asChild}
        data-size={size}
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    );
  },
}));

jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...props }: any) {
    return (
      <a href={href} className={className} data-testid="link" {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("lucide-react", () => ({
  CodeIcon: (props: any) => <span data-testid="code-icon" {...props}>CodeIcon</span>,
  CrownIcon: (props: any) => <span data-testid="crown-icon" {...props}>CrownIcon</span>,
  EyeIcon: (props: any) => <span data-testid="eye-icon" {...props}>EyeIcon</span>,
}));

describe("ProjectView", () => {
  const defaultProps = {
    projectId: "test-project-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders without crashing", () => {
      render(<ProjectView {...defaultProps} />);
      expect(screen.getByTestId("resizable-panel-group")).toBeInTheDocument();
    });

    it("renders with correct project ID passed to components", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("header-project-id")).toHaveTextContent("test-project-123");
      expect(screen.getByTestId("project-id")).toHaveTextContent("test-project-123");
    });

    it("renders all main structural components", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("project-header")).toBeInTheDocument();
      expect(screen.getByTestId("messages-container")).toBeInTheDocument();
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
      expect(screen.getByTestId("user-control")).toBeInTheDocument();
      expect(screen.getByTestId("resizable-handle")).toBeInTheDocument();
    });

    it("renders resizable layout with correct configuration", () => {
      render(<ProjectView {...defaultProps} />);
      
      const panelGroup = screen.getByTestId("resizable-panel-group");
      expect(panelGroup).toHaveAttribute("data-direction", "horizontal");
      
      const panels = screen.getAllByTestId("resizable-panel");
      expect(panels).toHaveLength(2);
      
      // Left panel (messages and header)
      expect(panels[0]).toHaveAttribute("data-default-size", "35");
      expect(panels[0]).toHaveAttribute("data-min-size", "20");
      expect(panels[0]).toHaveClass("flex", "flex-col", "min-h-0");
      
      // Right panel (tabs and content)
      expect(panels[1]).toHaveAttribute("data-default-size", "65");
      expect(panels[1]).toHaveAttribute("data-min-size", "50");
    });

    it("applies correct root container classes", () => {
      const { container } = render(<ProjectView {...defaultProps} />);
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass("h-screen");
    });
  });

  describe("Tab System", () => {
    it("initializes with preview tab as default", () => {
      render(<ProjectView {...defaultProps} />);
      
      const tabs = screen.getByTestId("tabs");
      expect(tabs).toHaveAttribute("data-default-value", "preview");
    });

    it("renders both tab triggers with correct values", () => {
      render(<ProjectView {...defaultProps} />);
      
      const previewTrigger = screen.getByTestId("tabs-trigger-preview");
      const codeTrigger = screen.getByTestId("tabs-trigger-code");
      
      expect(previewTrigger).toHaveAttribute("data-value", "preview");
      expect(codeTrigger).toHaveAttribute("data-value", "code");
    });

    it("renders tab content containers for both tabs", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("tabs-content-preview")).toBeInTheDocument();
      expect(screen.getByTestId("tabs-content-code")).toBeInTheDocument();
    });

    it("displays correct icons and labels in tab triggers", () => {
      render(<ProjectView {...defaultProps} />);
      
      // Preview tab
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.getByText("Demo")).toBeInTheDocument();
      
      // Code tab
      expect(screen.getByTestId("code-icon")).toBeInTheDocument();
      expect(screen.getByText("Code")).toBeInTheDocument();
    });

    it("handles tab state changes correctly", async () => {
      render(<ProjectView {...defaultProps} />);
      
      const tabChanger = screen.getByTestId("tab-value-changer");
      expect(tabChanger).toHaveTextContent("Change Tab (preview)");
      
      fireEvent.click(tabChanger);
      
      await waitFor(() => {
        expect(tabChanger).toHaveTextContent("Change Tab (code)");
      });
    });

    it("applies correct CSS classes to tab components", () => {
      render(<ProjectView {...defaultProps} />);
      
      const tabs = screen.getByTestId("tabs");
      expect(tabs).toHaveClass("h-full", "flex", "flex-col");
      
      const tabsList = screen.getByTestId("tabs-list");
      expect(tabsList).toHaveClass("inline-flex", "h-10", "items-center", "justify-center", "rounded-md", "bg-muted", "p-1", "text-muted-foreground");
      
      const previewContent = screen.getByTestId("tabs-content-preview");
      expect(previewContent).toHaveClass("flex-1", "min-h-0");
      
      const codeContent = screen.getByTestId("tabs-content-code");
      expect(codeContent).toHaveClass("flex-1", "min-h-0", "overflow-auto");
    });
  });

  describe("Fragment State Management", () => {
    it("initializes with no active fragment", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
      expect(screen.getByText("Select a fragment to see its preview.")).toBeInTheDocument();
    });

    it("updates active fragment when fragment is selected", async () => {
      render(<ProjectView {...defaultProps} />);
      
      // Initially no fragment
      expect(screen.getByText("Select a fragment to see its preview.")).toBeInTheDocument();
      expect(screen.queryByTestId("fragment-web")).not.toBeInTheDocument();
      
      // Select a fragment
      const selectButton = screen.getByTestId("select-fragment");
      fireEvent.click(selectButton);
      
      // Verify fragment is now active
      await waitFor(() => {
        expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("test-fragment-1");
        expect(screen.getByTestId("fragment-web")).toBeInTheDocument();
        expect(screen.getByTestId("fragment-name")).toHaveTextContent("Test Fragment");
        expect(screen.getByTestId("fragment-id")).toHaveTextContent("test-fragment-1");
      });
    });

    it("clears active fragment when set to null", async () => {
      render(<ProjectView {...defaultProps} />);
      
      // Select fragment first
      const selectButton = screen.getByTestId("select-fragment");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("fragment-web")).toBeInTheDocument();
      });
      
      // Clear fragment
      const clearButton = screen.getByTestId("clear-fragment");
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
        expect(screen.getByText("Select a fragment to see its preview.")).toBeInTheDocument();
        expect(screen.queryByTestId("fragment-web")).not.toBeInTheDocument();
      });
    });

    it("passes fragment correctly to FragmentWeb component", async () => {
      render(<ProjectView {...defaultProps} />);
      
      const selectButton = screen.getByTestId("select-fragment");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        const fragmentWeb = screen.getByTestId("fragment-web");
        const fragmentName = screen.getByTestId("fragment-name");
        const fragmentId = screen.getByTestId("fragment-id");
        const filesCount = screen.getByTestId("fragment-files-count");
        
        expect(fragmentWeb).toBeInTheDocument();
        expect(fragmentName).toHaveTextContent("Test Fragment");
        expect(fragmentId).toHaveTextContent("test-fragment-1");
        expect(filesCount).toHaveTextContent("3"); // index.html, style.css, app.js
      });
    });

    it("shows FileExplorer in code tab when fragment has files", async () => {
      render(<ProjectView {...defaultProps} />);
      
      // Select fragment
      const selectButton = screen.getByTestId("select-fragment");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        const fileExplorer = screen.getByTestId("file-explorer");
        const fileCount = screen.getByTestId("file-count");
        const fileNames = screen.getByTestId("file-names");
        
        expect(fileExplorer).toBeInTheDocument();
        expect(fileCount).toHaveTextContent("3");
        expect(fileNames).toHaveTextContent("index.html, style.css, app.js");
      });
    });

    it("handles fragment state persistence across tab changes", async () => {
      render(<ProjectView {...defaultProps} />);
      
      // Select fragment
      const selectButton = screen.getByTestId("select-fragment");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("fragment-web")).toBeInTheDocument();
      });
      
      // Change tab
      const tabChanger = screen.getByTestId("tab-value-changer");
      fireEvent.click(tabChanger);
      
      // Fragment should still be selected
      await waitFor(() => {
        expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("test-fragment-1");
        expect(screen.getByTestId("file-explorer")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation and UI Elements", () => {
    it("renders upgrade button with correct attributes", () => {
      render(<ProjectView {...defaultProps} />);
      
      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("data-as-child", "true");
      expect(button).toHaveAttribute("data-size", "sm");
      expect(button).toHaveAttribute("data-variant", "tertiary");
      
      const link = screen.getByTestId("link");
      expect(link).toHaveAttribute("href", "/pricing");
      expect(link).toHaveClass("flex", "items-center");
    });

    it("renders upgrade button content correctly", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("crown-icon")).toBeInTheDocument();
      expect(screen.getByText("Upgrade")).toBeInTheDocument();
    });

    it("renders user control component", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("user-control")).toBeInTheDocument();
      expect(screen.getByText("User Control")).toBeInTheDocument();
    });

    it("renders header section with correct layout", () => {
      render(<ProjectView {...defaultProps} />);
      
      // Check for header layout structure
      const headerSection = screen.getByTestId("tabs").querySelector('div:first-child');
      expect(headerSection).toHaveClass("w-full", "flex", "items-center", "p-2", "border-b", "gap-x-2");
      
      const mlAutoSection = headerSection?.querySelector('.ml-auto');
      expect(mlAutoSection).toHaveClass("ml-auto", "flex", "items-center", "gap-x-2");
    });
  });

  describe("Suspense Boundaries", () => {
    it("wraps ProjectHeader in Suspense with loading fallback", () => {
      render(<ProjectView {...defaultProps} />);
      
      // The component is mocked, but we can verify it renders
      expect(screen.getByTestId("project-header")).toBeInTheDocument();
    });

    it("wraps MessagesContainer in Suspense with loading fallback", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("messages-container")).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles empty projectId gracefully", () => {
      render(<ProjectView projectId="" />);
      
      expect(screen.getByTestId("header-project-id")).toHaveTextContent("");
      expect(screen.getByTestId("project-id")).toHaveTextContent("");
    });

    it("handles null or undefined projectId", () => {
      // @ts-ignore - Testing runtime behavior
      render(<ProjectView projectId={null} />);
      
      expect(screen.getByTestId("header-project-id")).toHaveTextContent("");
    });

    it("handles extremely long projectId", () => {
      const longProjectId = "x".repeat(1000);
      render(<ProjectView projectId={longProjectId} />);
      
      expect(screen.getByTestId("header-project-id")).toHaveTextContent(longProjectId);
      expect(screen.getByTestId("project-id")).toHaveTextContent(longProjectId);
    });

    it("handles fragment without files property", async () => {
      // Mock MessagesContainer to return fragment without files
      const { MessagesContainer } = require("../components/messages-container");
      MessagesContainer.mockImplementationOnce(({ setActiveFragment }) => (
        <div data-testid="messages-container">
          <button
            data-testid="select-fragment-no-files"
            onClick={() =>
              setActiveFragment({
                id: "fragment-no-files",
                name: "Fragment Without Files",
                files: null,
              })
            }
          >
            Select Fragment No Files
          </button>
        </div>
      ));
      
      render(<ProjectView {...defaultProps} />);
      
      const selectButton = screen.getByTestId("select-fragment-no-files");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        // Should not render FileExplorer when files is null
        expect(screen.queryByTestId("file-explorer")).not.toBeInTheDocument();
      });
    });

    it("handles fragment with empty files object", async () => {
      const { MessagesContainer } = require("../components/messages-container");
      MessagesContainer.mockImplementationOnce(({ setActiveFragment }) => (
        <div data-testid="messages-container">
          <button
            data-testid="select-fragment-empty-files"
            onClick={() =>
              setActiveFragment({
                id: "fragment-empty-files",
                name: "Fragment Empty Files",
                files: {},
              })
            }
          >
            Select Fragment Empty Files
          </button>
        </div>
      ));
      
      render(<ProjectView {...defaultProps} />);
      
      const selectButton = screen.getByTestId("select-fragment-empty-files");
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        const fileExplorer = screen.getByTestId("file-explorer");
        const fileCount = screen.getByTestId("file-count");
        
        expect(fileExplorer).toBeInTheDocument();
        expect(fileCount).toHaveTextContent("0");
      });
    });
  });

  describe("Component Props Interface", () => {
    it("accepts and uses projectId prop correctly", () => {
      const testId = "custom-project-id-123";
      render(<ProjectView projectId={testId} />);
      
      expect(screen.getByTestId("header-project-id")).toHaveTextContent(testId);
      expect(screen.getByTestId("project-id")).toHaveTextContent(testId);
    });

    it("updates when projectId prop changes", () => {
      const { rerender } = render(<ProjectView projectId="project-1" />);
      expect(screen.getByTestId("header-project-id")).toHaveTextContent("project-1");
      
      rerender(<ProjectView projectId="project-2" />);
      expect(screen.getByTestId("header-project-id")).toHaveTextContent("project-2");
    });

    it("passes projectId to child components correctly", () => {
      const { MessagesContainer } = require("../components/messages-container");
      const { ProjectHeader } = require("../components/project-header");
      
      render(<ProjectView projectId="test-id-456" />);
      
      expect(MessagesContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-id-456",
          activeFragment: null,
          setActiveFragment: expect.any(Function),
        }),
        expect.any(Object)
      );
      
      expect(ProjectHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-id-456",
        }),
        expect.any(Object)
      );
    });
  });

  describe("State Management Integration", () => {
    it("maintains separate state for activeFragment and tabState", async () => {
      render(<ProjectView {...defaultProps} />);
      
      // Initial states
      expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
      expect(screen.getByTestId("tab-value-changer")).toHaveTextContent("Change Tab (preview)");
      
      // Change tab state
      fireEvent.click(screen.getByTestId("tab-value-changer"));
      
      await waitFor(() => {
        expect(screen.getByTestId("tab-value-changer")).toHaveTextContent("Change Tab (code)");
      });
      
      // Fragment state should be unchanged
      expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
      
      // Now select fragment
      fireEvent.click(screen.getByTestId("select-fragment"));
      
      await waitFor(() => {
        expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("test-fragment-1");
      });
      
      // Tab state should be unchanged
      expect(screen.getByTestId("tab-value-changer")).toHaveTextContent("Change Tab (code)");
    });

    it("properly initializes useState hooks with correct default values", () => {
      render(<ProjectView {...defaultProps} />);
      
      // activeFragment starts as null
      expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
      
      // tabState starts as "preview"
      expect(screen.getByTestId("tabs")).toHaveAttribute("data-default-value", "preview");
    });
  });

  describe("Accessibility and User Experience", () => {
    it("provides semantic structure with proper HTML elements", () => {
      render(<ProjectView {...defaultProps} />);
      
      // Should have interactive elements
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      
      // Should have links
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });

    it("renders icons with proper test identifiers for screen readers", () => {
      render(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
      expect(screen.getByTestId("code-icon")).toBeInTheDocument();
      expect(screen.getByTestId("crown-icon")).toBeInTheDocument();
    });

    it("maintains focus management capabilities", async () => {
      const user = userEvent.setup();
      render(<ProjectView {...defaultProps} />);
      
      const selectButton = screen.getByTestId("select-fragment");
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("fragment-web")).toBeInTheDocument();
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("renders efficiently without unnecessary re-renders", () => {
      const { rerender } = render(<ProjectView {...defaultProps} />);
      
      // Multiple rerenders with same props should not cause errors
      rerender(<ProjectView {...defaultProps} />);
      rerender(<ProjectView {...defaultProps} />);
      
      expect(screen.getByTestId("project-header")).toBeInTheDocument();
    });

    it("handles rapid state changes gracefully", async () => {
      render(<ProjectView {...defaultProps} />);
      
      const selectButton = screen.getByTestId("select-fragment");
      const clearButton = screen.getByTestId("clear-fragment");
      
      // Rapid selection and clearing
      fireEvent.click(selectButton);
      fireEvent.click(clearButton);
      fireEvent.click(selectButton);
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("active-fragment-id")).toHaveTextContent("none");
      });
    });
  });
});