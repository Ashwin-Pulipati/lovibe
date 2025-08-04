import React from 'react'
import { render, screen } from '@testing-library/react'
import { Navbar } from './navbar'

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, ...props }: any) {
    return <img src={src} alt={alt} width={width} height={height} data-testid="logo-image" {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ href, children, className, ...props }: any) {
    return <a href={href} className={className} {...props}>{children}</a>
  }
})

// Mock UI Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, ...props }: any) => (
    <button 
      data-variant={variant} 
      data-size={size} 
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

// Mock UserControl component
jest.mock('@/components/user-control', () => ({
  UserControl: ({ showName, ...props }: { showName?: boolean }) => (
    <div data-testid="user-control" data-show-name={showName} {...props}>
      User Control Component
    </div>
  )
}))

// Mock Clerk authentication components
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in" data-clerk-component="SignedIn">
      {children}
    </div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out" data-clerk-component="SignedOut">
      {children}
    </div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-up-button" data-clerk-component="SignUpButton">
      {children}
    </div>
  ),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button" data-clerk-component="SignInButton">
      {children}
    </div>
  )
}))

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Basic Rendering and Structure', () => {
    test('renders without crashing', () => {
      expect(() => render(<Navbar />)).not.toThrow()
    })

    test('renders the navigation element with correct classes', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveClass(
        'p-4',
        'bg-transparent', 
        'fixed',
        'top-0',
        'left-0',
        'right-0',
        'z-50',
        'transition-all',
        'duration-200',
        'border-b',
        'border-transparent'
      )
    })

    test('has proper container structure with responsive classes', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      const container = nav.firstElementChild
      
      expect(container).toHaveClass(
        'max-w-5xl',
        'mx-auto',
        'w-full',
        'flex',
        'justify-between',
        'items-center'
      )
    })
  })

  describe('Logo and Brand Section', () => {
    test('renders the logo image with correct attributes', () => {
      render(<Navbar />)
      
      const logo = screen.getByTestId('logo-image')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/logo.png')
      expect(logo).toHaveAttribute('alt', 'Logo')
      expect(logo).toHaveAttribute('width', '36')
      expect(logo).toHaveAttribute('height', '36')
    })

    test('renders the Lovibe brand text with correct styling', () => {
      render(<Navbar />)
      
      const brandText = screen.getByText('Lovibe')
      expect(brandText).toBeInTheDocument()
      expect(brandText).toHaveClass(
        'text-xl',
        'font-serif',
        'font-semibold',
        'tracking-wider'
      )
    })

    test('wraps logo and brand in a home link', () => {
      render(<Navbar />)
      
      const homeLinks = screen.getAllByRole('link')
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/')
      
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveClass('flex', 'items-center', 'gap-2')
      expect(homeLink).toContainElement(screen.getByTestId('logo-image'))
      expect(homeLink).toContainElement(screen.getByText('Lovibe'))
    })

    test('logo link has correct accessibility attributes', () => {
      render(<Navbar />)
      
      const homeLinks = screen.getAllByRole('link')
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/')
      
      expect(homeLink).toHaveAttribute('href', '/')
      // The link contains both logo and text, making it accessible
      expect(homeLink).toContainElement(screen.getByAltText('Logo'))
      expect(homeLink).toContainElement(screen.getByText('Lovibe'))
    })
  })

  describe('Authentication State Components', () => {
    test('renders SignedOut component with authentication buttons', () => {
      render(<Navbar />)
      
      const signedOut = screen.getByTestId('signed-out')
      expect(signedOut).toBeInTheDocument()
      expect(signedOut).toHaveAttribute('data-clerk-component', 'SignedOut')
    })

    test('renders SignedIn component with UserControl', () => {
      render(<Navbar />)
      
      const signedIn = screen.getByTestId('signed-in')
      expect(signedIn).toBeInTheDocument()
      expect(signedIn).toHaveAttribute('data-clerk-component', 'SignedIn')
      
      const userControl = screen.getByTestId('user-control')
      expect(signedIn).toContainElement(userControl)
    })

    test('renders both authentication states (Clerk handles conditional display)', () => {
      render(<Navbar />)
      
      // Both components should be present as Clerk handles the conditional rendering
      expect(screen.getByTestId('signed-in')).toBeInTheDocument()
      expect(screen.getByTestId('signed-out')).toBeInTheDocument()
    })
  })

  describe('Authentication Buttons', () => {
    test('renders Sign Up button with correct properties', () => {
      render(<Navbar />)
      
      const signUpWrapper = screen.getByTestId('sign-up-button')
      expect(signUpWrapper).toBeInTheDocument()
      expect(signUpWrapper).toHaveAttribute('data-clerk-component', 'SignUpButton')
      
      const signUpButton = screen.getByText('Sign Up')
      expect(signUpButton).toBeInTheDocument()
      expect(signUpButton).toHaveAttribute('data-variant', 'outline')
      expect(signUpButton).toHaveAttribute('data-size', 'sm')
    })

    test('renders Sign In button with correct properties', () => {
      render(<Navbar />)
      
      const signInWrapper = screen.getByTestId('sign-in-button')
      expect(signInWrapper).toBeInTheDocument()
      expect(signInWrapper).toHaveAttribute('data-clerk-component', 'SignInButton')
      
      const signInButton = screen.getByText('Sign In')
      expect(signInButton).toBeInTheDocument()
      expect(signInButton).toHaveAttribute('data-size', 'sm')
      // Sign In button has no variant specified, so it should use default
      expect(signInButton).not.toHaveAttribute('data-variant')
    })

    test('has correct button container layout', () => {
      render(<Navbar />)
      
      const signedOut = screen.getByTestId('signed-out')
      const buttonContainer = signedOut.querySelector('div.flex.gap-2')
      
      expect(buttonContainer).toBeInTheDocument()
      expect(buttonContainer).toContainElement(screen.getByTestId('sign-up-button'))
      expect(buttonContainer).toContainElement(screen.getByTestId('sign-in-button'))
    })

    test('buttons appear in correct order (Sign Up, then Sign In)', () => {
      render(<Navbar />)
      
      const signedOut = screen.getByTestId('signed-out')
      const buttons = signedOut.querySelectorAll('[data-testid*="sign-"]')
      
      expect(buttons[0]).toHaveAttribute('data-testid', 'sign-up-button')
      expect(buttons[1]).toHaveAttribute('data-testid', 'sign-in-button')
    })
  })

  describe('UserControl Integration', () => {
    test('passes showName prop correctly to UserControl', () => {
      render(<Navbar />)
      
      const userControl = screen.getByTestId('user-control')
      expect(userControl).toHaveAttribute('data-show-name', 'true')
    })

    test('UserControl is only rendered within SignedIn component', () => {
      render(<Navbar />)
      
      const signedIn = screen.getByTestId('signed-in')
      const signedOut = screen.getByTestId('signed-out')
      const userControl = screen.getByTestId('user-control')
      
      expect(signedIn).toContainElement(userControl)
      expect(signedOut).not.toContainElement(userControl)
    })

    test('renders UserControl with expected content', () => {
      render(<Navbar />)
      
      const userControl = screen.getByTestId('user-control')
      expect(userControl).toBeInTheDocument()
      expect(userControl).toHaveTextContent('User Control Component')
    })
  })

  describe('CSS Classes and Styling', () => {
    test('applies correct fixed positioning classes', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
    })

    test('applies correct z-index for overlay positioning', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('z-50')
    })

    test('applies transparent background and padding', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-transparent', 'p-4')
    })

    test('applies transition classes for animations', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('transition-all', 'duration-200')
    })

    test('applies border classes correctly', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('border-b', 'border-transparent')
    })

    test('container has correct responsive and layout classes', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      const container = nav.firstElementChild
      
      expect(container).toHaveClass(
        'max-w-5xl', // Max width constraint
        'mx-auto',   // Center horizontally
        'w-full',    // Full width
        'flex',      // Flexbox layout
        'justify-between', // Space between elements
        'items-center'     // Center items vertically
      )
    })
  })

  describe('Accessibility Features', () => {
    test('uses semantic navigation element', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(nav.tagName).toBe('NAV')
    })

    test('logo has descriptive alt text', () => {
      render(<Navbar />)
      
      const logo = screen.getByAltText('Logo')
      expect(logo).toBeInTheDocument()
    })

    test('home link is keyboard accessible', () => {
      render(<Navbar />)
      
      const homeLinks = screen.getAllByRole('link')
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/')
      
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })

    test('authentication buttons have accessible text', () => {
      render(<Navbar />)
      
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    test('maintains focus management for interactive elements', () => {
      render(<Navbar />)
      
      const homeLinks = screen.getAllByRole('link')
      const homeLink = homeLinks.find(link => link.getAttribute('href') === '/')
      const signUpButton = screen.getByText('Sign Up')
      const signInButton = screen.getByText('Sign In')
      
      expect(homeLink).toBeInTheDocument()
      expect(signUpButton).toBeInTheDocument()
      expect(signInButton).toBeInTheDocument()
    })
  })

  describe('Component Props and Configuration', () => {
    test('renders correctly without any props', () => {
      expect(() => render(<Navbar />)).not.toThrow()
      
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    test('maintains consistent structure across multiple renders', () => {
      const { rerender } = render(<Navbar />)
      
      expect(screen.getByText('Lovibe')).toBeInTheDocument()
      expect(screen.getByTestId('logo-image')).toBeInTheDocument()
      
      rerender(<Navbar />)
      
      expect(screen.getByText('Lovibe')).toBeInTheDocument()
      expect(screen.getByTestId('logo-image')).toBeInTheDocument()
    })

    test('is a pure component (no side effects)', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Navbar />)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('handles component mount and unmount gracefully', () => {
      const { unmount } = render(<Navbar />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      expect(() => unmount()).not.toThrow()
    })

    test('renders with correct structure even if external dependencies fail', () => {
      render(<Navbar />)
      
      // Core structure should always be present
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Lovibe')).toBeInTheDocument()
    })

    test('handles missing logo path gracefully', () => {
      render(<Navbar />)
      
      const logo = screen.getByTestId('logo-image')
      expect(logo).toHaveAttribute('src', '/logo.png')
      // Next.js Image component handles missing images internally
    })

    test('maintains layout integrity with different screen sizes', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('max-w-5xl') // Responsive max-width
      expect(container).toHaveClass('mx-auto')   // Center alignment
    })
  })

  describe('Component Integration and Dependencies', () => {
    test('integrates with all required Next.js components', () => {
      render(<Navbar />)
      
      // Next.js Image
      expect(screen.getByTestId('logo-image')).toBeInTheDocument()
      // Next.js Link
      const homeLinks = screen.getAllByRole('link')
      expect(homeLinks.find(link => link.getAttribute('href') === '/')).toBeInTheDocument()
    })

    test('integrates with all required Clerk components', () => {
      render(<Navbar />)
      
      expect(screen.getByTestId('signed-in')).toBeInTheDocument()
      expect(screen.getByTestId('signed-out')).toBeInTheDocument()
      expect(screen.getByTestId('sign-up-button')).toBeInTheDocument()
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    })

    test('integrates with custom UI components', () => {
      render(<Navbar />)
      
      // Custom Button components
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      // Custom UserControl component
      expect(screen.getByTestId('user-control')).toBeInTheDocument()
    })

    test('maintains proper component hierarchy', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      const signedIn = screen.getByTestId('signed-in')
      const signedOut = screen.getByTestId('signed-out')
      const userControl = screen.getByTestId('user-control')
      
      // Verify hierarchy
      expect(nav).toContainElement(signedIn)
      expect(nav).toContainElement(signedOut)
      expect(signedIn).toContainElement(userControl)
    })
  })

  describe('Performance and Optimization', () => {
    test('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<Navbar />)
      
      const initialNav = screen.getByRole('navigation')
      
      rerender(<Navbar />)
      
      const secondNav = screen.getByRole('navigation')
      expect(secondNav).toBeInTheDocument()
    })

    test('handles rapid successive renders without errors', () => {
      const { rerender } = render(<Navbar />)
      
      // Simulate rapid re-renders
      for (let i = 0; i < 5; i++) {
        expect(() => rerender(<Navbar />)).not.toThrow()
      }
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Layout and Responsive Design', () => {
    test('applies correct flexbox layout for content distribution', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('flex', 'justify-between', 'items-center')
    })

    test('applies responsive container constraints', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('max-w-5xl', 'mx-auto', 'w-full')
    })

    test('positions navbar correctly for overlay behavior', () => {
      render(<Navbar />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })
  })

  describe('Button Variants and Styling', () => {
    test('Sign Up button uses outline variant for visual distinction', () => {
      render(<Navbar />)
      
      const signUpButton = screen.getByText('Sign Up')
      expect(signUpButton).toHaveAttribute('data-variant', 'outline')
    })

    test('Sign In button uses default variant (solid)', () => {
      render(<Navbar />)
      
      const signInButton = screen.getByText('Sign In')
      expect(signInButton).not.toHaveAttribute('data-variant')
    })

    test('both buttons use small size for compact navbar', () => {
      render(<Navbar />)
      
      const signUpButton = screen.getByText('Sign Up')
      const signInButton = screen.getByText('Sign In')
      
      expect(signUpButton).toHaveAttribute('data-size', 'sm')
      expect(signInButton).toHaveAttribute('data-size', 'sm')
    })
  })

  describe('Brand and Logo Styling', () => {
    test('brand text uses serif font for elegant appearance', () => {
      render(<Navbar />)
      
      const brandText = screen.getByText('Lovibe')
      expect(brandText).toHaveClass('font-serif')
    })

    test('brand text has proper text size and weight', () => {
      render(<Navbar />)
      
      const brandText = screen.getByText('Lovibe')
      expect(brandText).toHaveClass('text-xl', 'font-semibold')
    })

    test('brand text has tracking for improved readability', () => {
      render(<Navbar />)
      
      const brandText = screen.getByText('Lovibe')
      expect(brandText).toHaveClass('tracking-wider')
    })

    test('logo has appropriate dimensions for navbar', () => {
      render(<Navbar />)
      
      const logo = screen.getByTestId('logo-image')
      expect(logo).toHaveAttribute('width', '36')
      expect(logo).toHaveAttribute('height', '36')
    })
  })

  describe('Responsive Layout Behavior', () => {
    test('navbar container has max-width constraint for large screens', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('max-w-5xl')
    })

    test('navbar container centers content horizontally', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('mx-auto')
    })

    test('navbar uses full width within constraints', () => {
      render(<Navbar />)
      
      const container = screen.getByRole('navigation').firstElementChild
      expect(container).toHaveClass('w-full')
    })
  })
})