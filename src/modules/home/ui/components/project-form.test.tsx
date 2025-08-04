import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import { ProjectForm } from './project-form';
import { useTRPC } from '@/trpc/client';
import { PROJECT_TEMPLATES } from '../../constants';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

jest.mock('@/trpc/client', () => ({
  useTRPC: jest.fn(),
}));

jest.mock('../../constants', () => ({
  PROJECT_TEMPLATES: [
    { title: 'Todo App', emoji: '📝', prompt: 'Create a todo application' },
    { title: 'Blog', emoji: '📖', prompt: 'Build a personal blog' },
    { title: 'E-commerce', emoji: '🛒', prompt: 'Create an online store' },
  ],
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/form', () => ({
  FormField: ({ render, control, name }: any) => {
    const field = { value: '', onChange: jest.fn(), onBlur: jest.fn(), name };
    return render({ field });
  },
}));

jest.mock('react-textarea-autosize', () => {
  return function TextareaAutosize(props: any) {
    return <textarea {...props} />;
  };
});

jest.mock('lucide-react', () => ({
  ArrowUpIcon: () => <div data-testid="arrow-up-icon">ArrowUp</div>,
  Loader2Icon: ({ className }: any) => <div data-testid="loader-icon" className={className}>Loading</div>,
}));

describe('ProjectForm', () => {
  let mockRouter: any;
  let mockClerk: any;
  let mockTrpc: any;
  let queryClient: QueryClient;
  let mockMutate: jest.Mock;
  let mockInvalidateQueries: jest.Mock;

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockInvalidateQueries = jest.fn();
    queryClient.invalidateQueries = mockInvalidateQueries;

    // Setup router mock
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup clerk mock
    mockClerk = {
      openSignIn: jest.fn(),
    };
    (useClerk as jest.Mock).mockReturnValue(mockClerk);

    // Setup tRPC mock
    mockMutate = jest.fn();
    mockTrpc = {
      projects: {
        create: {
          mutationOptions: jest.fn((options) => ({
            mutationFn: mockMutate,
            ...options,
          })),
        },
        getMany: {
          queryOptions: jest.fn(() => ({ queryKey: ['projects'] })),
        },
      },
    };
    (useTRPC as jest.Mock).mockReturnValue(mockTrpc);
  });

  describe('Rendering', () => {
    it('should render the form with textarea and submit button', () => {
      renderWithProviders(<ProjectForm />);
      
      expect(screen.getByPlaceholderText('What would you like to build?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByText('⌘Enter')).toBeInTheDocument();
      expect(screen.getByText('to Submit')).toBeInTheDocument();
    });

    it('should render project template buttons', () => {
      renderWithProviders(<ProjectForm />);
      
      expect(screen.getByText('📝 Todo App')).toBeInTheDocument();
      expect(screen.getByText('📖 Blog')).toBeInTheDocument();
      expect(screen.getByText('🛒 E-commerce')).toBeInTheDocument();
    });

    it('should show arrow icon when not pending', () => {
      renderWithProviders(<ProjectForm />);
      
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update textarea value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      await user.type(textarea, 'My awesome project');
      
      expect(textarea).toHaveValue('My awesome project');
    });

    it('should enable submit button when form is valid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      expect(submitButton).toBeDisabled();
      
      await user.type(textarea, 'Valid project description');
      
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should keep submit button disabled when form is invalid', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      expect(submitButton).toBeDisabled();
      
      // Empty input should keep button disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const form = textarea.closest('form');
      
      await user.click(textarea);
      expect(form).toHaveClass('shadow-xs');
      
      await user.click(document.body);
      expect(form).not.toHaveClass('shadow-xs');
    });
  });

  describe('Template Selection', () => {
    it('should populate textarea when template is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const todoButton = screen.getByText('📝 Todo App');
      
      await user.click(todoButton);
      
      expect(textarea).toHaveValue('Create a todo application');
    });

    it('should handle multiple template selections', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const todoButton = screen.getByText('📝 Todo App');
      const blogButton = screen.getByText('📖 Blog');
      
      await user.click(todoButton);
      expect(textarea).toHaveValue('Create a todo application');
      
      await user.click(blogButton);
      expect(textarea).toHaveValue('Build a personal blog');
    });
  });

  describe('Form Submission', () => {
    it('should call createProject mutation on successful form submission', async () => {
      const user = userEvent.setup();
      mockMutate.mockResolvedValue({ id: 'project-123' });
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await user.type(textarea, 'My test project');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          value: 'My test project',
        });
      });
    });

    it('should submit form when Enter key is pressed without Shift', async () => {
      const user = userEvent.setup();
      mockMutate.mockResolvedValue({ id: 'project-123' });
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.type(textarea, '{Enter}');
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          value: 'My test project',
        });
      });
    });

    it('should not submit form when Enter key is pressed with Shift', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should show loader and disable form during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMutate.mockReturnValue(pendingPromise);
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await user.type(textarea, 'My test project');
      await user.click(submitButton);
      
      // Check loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-up-icon')).not.toBeInTheDocument();
      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();
      
      // Resolve the promise
      act(() => {
        resolvePromise!({ id: 'project-123' });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success Handling', () => {
    it('should invalidate queries and navigate on successful creation', async () => {
      const user = userEvent.setup();
      const mockProjectData = { id: 'project-123' };
      mockMutate.mockResolvedValue(mockProjectData);
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.type(textarea, '{Enter}');
      
      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] });
        expect(mockRouter.push).toHaveBeenCalledWith('/projects/project-123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on mutation failure', async () => {
      const user = userEvent.setup();
      const error = new Error('Failed to create project');
      mockMutate.mockRejectedValue(error);
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.type(textarea, '{Enter}');
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create project');
      });
    });

    it('should open sign-in modal on unauthorized error', async () => {
      const user = userEvent.setup();
      const error = {
        message: 'Unauthorized',
        data: { code: 'UNAUTHORIZED' },
      };
      mockMutate.mockRejectedValue(error);
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.type(textarea, '{Enter}');
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Unauthorized');
        expect(mockClerk.openSignIn).toHaveBeenCalled();
      });
    });

    it('should not open sign-in modal on non-unauthorized error', async () => {
      const user = userEvent.setup();
      const error = {
        message: 'Server error',
        data: { code: 'INTERNAL_ERROR' },
      };
      mockMutate.mockRejectedValue(error);
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      await user.type(textarea, '{Enter}');
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
        expect(mockClerk.openSignIn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should handle minimum length validation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Empty input should disable submit
      expect(submitButton).toBeDisabled();
    });

    it('should handle maximum length validation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const longText = 'a'.repeat(10001); // Exceeds max length of 10000
      
      await user.type(textarea, longText);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should allow valid length input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const validText = 'a'.repeat(5000); // Within max length
      
      await user.type(textarea, validText);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle template selection with existing text', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const todoButton = screen.getByText('📝 Todo App');
      
      // Type some text first
      await user.type(textarea, 'Existing text');
      expect(textarea).toHaveValue('Existing text');
      
      // Select template should replace existing text
      await user.click(todoButton);
      expect(textarea).toHaveValue('Create a todo application');
    });

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      let resolveCount = 0;
      mockMutate.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ id: `project-${++resolveCount}` });
          }, 100);
        });
      });
      
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.type(textarea, 'My test project');
      
      // Try to submit multiple times rapidly
      await user.type(textarea, '{Enter}');
      await user.type(textarea, '{Enter}');
      await user.type(textarea, '{Enter}');
      
      // Should only call mutation once due to pending state
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty PROJECT_TEMPLATES array', () => {
      // Mock empty templates
      jest.doMock('../../constants', () => ({
        PROJECT_TEMPLATES: [],
      }));
      
      renderWithProviders(<ProjectForm />);
      
      // Form should still render without templates
      expect(screen.getByPlaceholderText('What would you like to build?')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      expect(textarea).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProjectForm />);
      
      const textarea = screen.getByPlaceholderText('What would you like to build?');
      
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.tab();
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toHaveFocus();
    });
  });
});