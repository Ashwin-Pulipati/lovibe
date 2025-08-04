"use client"

import { render, screen } from '@testing-library/react'
import { UserControl } from './user-control'
import { useCurrentTheme } from '@/hooks/use-current-theme'
import { UserButton } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

// Mock the useCurrentTheme hook
jest.mock('@/hooks/use-current-theme')
const mockUseCurrentTheme = useCurrentTheme as jest.MockedFunction<typeof useCurrentTheme>

// Mock Clerk's UserButton component
jest.mock('@clerk/nextjs', () => ({
  UserButton: jest.fn(() => <div data-testid="user-button">Mocked UserButton</div>)
}))

// Mock Clerk themes
jest.mock('@clerk/themes', () => ({
  dark: { name: 'dark-theme' }
}))

describe('UserControl Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Theme Handling', () => {
    it('should apply dark theme when currentTheme is "dark"', () => {
      mockUseCurrentTheme.mockReturnValue('dark')
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: dark
          })
        }),
        expect.anything()
      )
    })

    it('should apply undefined baseTheme when currentTheme is "light"', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should apply undefined baseTheme when currentTheme is null', () => {
      mockUseCurrentTheme.mockReturnValue(null)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should apply undefined baseTheme when currentTheme is undefined', () => {
      mockUseCurrentTheme.mockReturnValue(undefined)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should handle system theme from useCurrentTheme hook', () => {
      // Based on the hook implementation, it can return systemTheme
      mockUseCurrentTheme.mockReturnValue('dark')
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: dark
          })
        }),
        expect.anything()
      )
    })

    it('should handle unexpected theme values gracefully', () => {
      mockUseCurrentTheme.mockReturnValue('system' as any)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })
  })

  describe('showName Prop Handling', () => {
    beforeEach(() => {
      mockUseCurrentTheme.mockReturnValue('light')
    })

    it('should pass showName as true when provided', () => {
      render(<UserControl showName={true} />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          showName: true
        }),
        expect.anything()
      )
    })

    it('should pass showName as false when explicitly set to false', () => {
      render(<UserControl showName={false} />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          showName: false
        }),
        expect.anything()
      )
    })

    it('should pass showName as undefined when not provided', () => {
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          showName: undefined
        }),
        expect.anything()
      )
    })
  })

  describe('Appearance Configuration', () => {
    beforeEach(() => {
      mockUseCurrentTheme.mockReturnValue('light')
    })

    it('should apply correct CSS classes for userButtonBox element', () => {
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            elements: expect.objectContaining({
              userButtonBox: "rounded-md!"
            })
          })
        }),
        expect.anything()
      )
    })

    it('should apply correct CSS classes for userButtonAvatarBox element', () => {
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            elements: expect.objectContaining({
              userButtonAvatarBox: "rounded-md! size-8!"
            })
          })
        }),
        expect.anything()
      )
    })

    it('should apply correct CSS classes for userButtonTrigger element', () => {
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            elements: expect.objectContaining({
              userButtonTrigger: "rounded-md!"
            })
          })
        }),
        expect.anything()
      )
    })

    it('should include all required element styles in appearance config', () => {
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            elements: {
              userButtonBox: "rounded-md!",
              userButtonAvatarBox: "rounded-md! size-8!",
              userButtonTrigger: "rounded-md!"
            }
          })
        }),
        expect.anything()
      )
    })

    it('should maintain consistent Tailwind CSS class structure', () => {
      render(<UserControl />)
      
      const call = (UserButton as jest.Mock).mock.calls[0][0]
      const elements = call.appearance.elements
      
      // Verify all classes use Tailwind utility classes with ! important modifier
      expect(elements.userButtonBox).toMatch(/rounded-md!/)
      expect(elements.userButtonAvatarBox).toMatch(/rounded-md!.*size-8!/)
      expect(elements.userButtonTrigger).toMatch(/rounded-md!/)
    })
  })

  describe('Integration Tests', () => {
    it('should render UserButton with dark theme and showName true', () => {
      mockUseCurrentTheme.mockReturnValue('dark')
      
      render(<UserControl showName={true} />)
      
      expect(UserButton).toHaveBeenCalledWith(
        {
          showName: true,
          appearance: {
            elements: {
              userButtonBox: "rounded-md!",
              userButtonAvatarBox: "rounded-md! size-8!",
              userButtonTrigger: "rounded-md!"
            },
            baseTheme: dark
          }
        },
        expect.anything()
      )
    })

    it('should render UserButton with light theme and showName false', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl showName={false} />)
      
      expect(UserButton).toHaveBeenCalledWith(
        {
          showName: false,
          appearance: {
            elements: {
              userButtonBox: "rounded-md!",
              userButtonAvatarBox: "rounded-md! size-8!",
              userButtonTrigger: "rounded-md!"
            },
            baseTheme: undefined
          }
        },
        expect.anything()
      )
    })

    it('should render the mocked UserButton component in DOM', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      expect(screen.getByTestId('user-button')).toBeInTheDocument()
      expect(screen.getByText('Mocked UserButton')).toBeInTheDocument()
    })
  })

  describe('Hook Integration', () => {
    it('should call useCurrentTheme hook exactly once per render', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      expect(mockUseCurrentTheme).toHaveBeenCalledTimes(1)
    })

    it('should call useCurrentTheme hook with no arguments', () => {
      mockUseCurrentTheme.mockReturnValue('dark')
      
      render(<UserControl />)
      
      expect(mockUseCurrentTheme).toHaveBeenCalledWith()
    })

    it('should handle useCurrentTheme hook throwing an error', () => {
      mockUseCurrentTheme.mockImplementation(() => {
        throw new Error('Theme hook error')
      })
      
      // Should throw during render when hook fails
      expect(() => render(<UserControl />)).toThrow('Theme hook error')
    })

    it('should re-call hook on component re-render', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const { rerender } = render(<UserControl />)
      
      expect(mockUseCurrentTheme).toHaveBeenCalledTimes(1)
      
      rerender(<UserControl showName={true} />)
      
      expect(mockUseCurrentTheme).toHaveBeenCalledTimes(2)
    })
  })

  describe('Component Lifecycle', () => {
    it('should update theme when useCurrentTheme return value changes', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const { rerender } = render(<UserControl />)
      
      expect(UserButton).toHaveBeenLastCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )

      mockUseCurrentTheme.mockReturnValue('dark')
      rerender(<UserControl />)
      
      expect(UserButton).toHaveBeenLastCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: dark
          })
        }),
        expect.anything()
      )
    })

    it('should update showName prop on re-render', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const { rerender } = render(<UserControl showName={false} />)
      
      expect(UserButton).toHaveBeenLastCalledWith(
        expect.objectContaining({
          showName: false
        }),
        expect.anything()
      )

      rerender(<UserControl showName={true} />)
      
      expect(UserButton).toHaveBeenLastCalledWith(
        expect.objectContaining({
          showName: true
        }),
        expect.anything()
      )
    })

    it('should maintain appearance config across re-renders', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const { rerender } = render(<UserControl />)
      
      const firstCall = (UserButton as jest.Mock).mock.calls[0][0]
      
      rerender(<UserControl showName={true} />)
      
      const secondCall = (UserButton as jest.Mock).mock.calls[1][0]
      
      expect(firstCall.appearance.elements).toEqual(secondCall.appearance.elements)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string theme gracefully', () => {
      mockUseCurrentTheme.mockReturnValue('' as any)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should handle numeric theme value gracefully', () => {
      mockUseCurrentTheme.mockReturnValue(123 as any)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should handle object theme value gracefully', () => {
      mockUseCurrentTheme.mockReturnValue({ theme: 'dark' } as any)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })

    it('should handle boolean theme value gracefully', () => {
      mockUseCurrentTheme.mockReturnValue(true as any)
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: undefined
          })
        }),
        expect.anything()
      )
    })
  })

  describe('Props Interface Validation', () => {
    it('should accept valid UserControlProps interface', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const validProps: Parameters<typeof UserControl>[0] = {
        showName: true
      }
      
      expect(() => render(<UserControl {...validProps} />)).not.toThrow()
    })

    it('should accept empty props object', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      const emptyProps = {}
      
      expect(() => render(<UserControl {...emptyProps} />)).not.toThrow()
    })

    it('should handle optional showName prop correctly', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      // Test with prop omitted
      render(<UserControl />)
      expect(UserButton).toHaveBeenLastCalledWith(
        expect.objectContaining({
          showName: undefined
        }),
        expect.anything()
      )
    })
  })

  describe('Performance and Optimization', () => {
    it('should only call UserButton once per render', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      expect(UserButton).toHaveBeenCalledTimes(1)
    })

    it('should create consistent appearance object structure', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      const call = (UserButton as jest.Mock).mock.calls[0][0]
      
      expect(call.appearance).toHaveProperty('elements')
      expect(call.appearance).toHaveProperty('baseTheme')
      expect(call.appearance.elements).toHaveProperty('userButtonBox')
      expect(call.appearance.elements).toHaveProperty('userButtonAvatarBox')
      expect(call.appearance.elements).toHaveProperty('userButtonTrigger')
    })
  })

  describe('Accessibility and Styling', () => {
    it('should apply rounded styling to all button elements', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      const call = (UserButton as jest.Mock).mock.calls[0][0]
      const elements = call.appearance.elements
      
      expect(elements.userButtonBox).toContain('rounded-md!')
      expect(elements.userButtonAvatarBox).toContain('rounded-md!')
      expect(elements.userButtonTrigger).toContain('rounded-md!')
    })

    it('should apply size constraint to avatar box', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      const call = (UserButton as jest.Mock).mock.calls[0][0]
      
      expect(call.appearance.elements.userButtonAvatarBox).toContain('size-8!')
    })

    it('should use important modifier for all style overrides', () => {
      mockUseCurrentTheme.mockReturnValue('light')
      
      render(<UserControl />)
      
      const call = (UserButton as jest.Mock).mock.calls[0][0]
      const elements = call.appearance.elements
      
      Object.values(elements).forEach(className => {
        expect(className).toMatch(/!/)
      })
    })
  })
})