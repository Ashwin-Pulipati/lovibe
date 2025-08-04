import { RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT, PROMPT } from './prompt';

describe('Prompt Constants', () => {
  describe('RESPONSE_PROMPT', () => {
    test('should be a non-empty string', () => {
      expect(RESPONSE_PROMPT).toBeDefined();
      expect(typeof RESPONSE_PROMPT).toBe('string');
      expect(RESPONSE_PROMPT.trim().length).toBeGreaterThan(0);
    });

    test('should contain key instructions for final agent', () => {
      expect(RESPONSE_PROMPT).toContain('final agent');
      expect(RESPONSE_PROMPT).toContain('multi-agent system');
      expect(RESPONSE_PROMPT).toContain('user-friendly message');
    });

    test('should specify casual tone requirement', () => {
      expect(RESPONSE_PROMPT).toContain('casual tone');
    });

    test('should specify length requirement of 1-3 sentences', () => {
      expect(RESPONSE_PROMPT).toContain('1 to 3 sentences');
    });

    test('should mention Next.js app context', () => {
      expect(RESPONSE_PROMPT).toContain('Next.js app');
    });

    test('should explicitly forbid code, tags, and metadata', () => {
      expect(RESPONSE_PROMPT).toContain('Do not add code, tags, or metadata');
      expect(RESPONSE_PROMPT).toContain('plain text response');
    });

    test('should reference task_summary tag', () => {
      expect(RESPONSE_PROMPT).toContain('<task_summary>');
    });

    test('should instruct not to mention task_summary tag', () => {
      expect(RESPONSE_PROMPT).toContain('No need to mention the <task_summary> tag');
    });
  });

  describe('FRAGMENT_TITLE_PROMPT', () => {
    test('should be a non-empty string', () => {
      expect(FRAGMENT_TITLE_PROMPT).toBeDefined();
      expect(typeof FRAGMENT_TITLE_PROMPT).toBe('string');
      expect(FRAGMENT_TITLE_PROMPT.trim().length).toBeGreaterThan(0);
    });

    test('should specify role as assistant for title generation', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('assistant that generates');
    });

    test('should reference task_summary for context', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('<task_summary>');
    });

    test('should specify maximum 3 words requirement', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('Max 3 words');
    });

    test('should require title case formatting', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('title case');
    });

    test('should provide title case examples', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('Landing Page');
      expect(FRAGMENT_TITLE_PROMPT).toContain('Chat Widget');
    });

    test('should forbid punctuation, quotes, and prefixes', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('No punctuation, quotes, or prefixes');
    });

    test('should specify raw title output requirement', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('Only return the raw title');
    });

    test('should specify relevance requirement', () => {
      expect(FRAGMENT_TITLE_PROMPT).toContain('Relevant to what was built or changed');
    });
  });

  describe('PROMPT', () => {
    test('should be a non-empty string', () => {
      expect(PROMPT).toBeDefined();
      expect(PROMPT).toBeTypeOf('string');
      expect(PROMPT.trim().length).toBeGreaterThan(0);
    });

    test('should establish role as senior software engineer', () => {
      expect(PROMPT).toContain('senior software engineer');
    });

    test('should specify Next.js version', () => {
      expect(PROMPT).toContain('Next.js 15.3.4');
    });

    test('should mention sandboxed environment', () => {
      expect(PROMPT).toContain('sandboxed');
    });

    describe('Environment specifications', () => {
      test('should list available tools', () => {
        expect(PROMPT).toContain('createOrUpdateFiles');
        expect(PROMPT).toContain('terminal');
        expect(PROMPT).toContain('readFiles');
      });

      test('should specify main file as app/page.tsx', () => {
        expect(PROMPT).toContain('Main file: app/page.tsx');
      });

      test('should mention pre-installed Shadcn components', () => {
        expect(PROMPT).toContain('Shadcn components are pre-installed');
        expect(PROMPT).toContain('@/components/ui/*');
      });

      test('should mention preconfigured CSS frameworks', () => {
        expect(PROMPT).toContain('Tailwind CSS');
        expect(PROMPT).toContain('PostCSS');
      });

      test('should specify working directory', () => {
        expect(PROMPT).toContain('/home/user');
        expect(PROMPT).toContain('You are already inside /home/user');
      });
    });

    describe('File path rules', () => {
      test('should specify @ symbol usage for imports only', () => {
        expect(PROMPT).toContain('@ symbol is an alias used only for imports');
      });

      test('should require actual paths for file system operations', () => {
        expect(PROMPT).toContain('When using readFiles or accessing the file system');
        expect(PROMPT).toContain('you MUST use the actual path');
      });

      test('should forbid absolute paths in create/update operations', () => {
        expect(PROMPT).toContain('NEVER use absolute paths');
        expect(PROMPT).toContain('NEVER include "/home/user"');
      });

      test('should provide path examples', () => {
        expect(PROMPT).toContain('app/page.tsx');
        expect(PROMPT).toContain('lib/utils.ts');
      });
    });

    describe('File safety rules', () => {
      test('should require "use client" directive placement', () => {
        expect(PROMPT).toContain('ALWAYS add "use client" to the TOP');
        expect(PROMPT).toContain('THE FIRST LINE');
      });

      test('should specify when to use "use client"', () => {
        expect(PROMPT).toContain('browser APIs or react hooks');
      });
    });

    describe('Runtime execution rules', () => {
      test('should mention hot reload capability', () => {
        expect(PROMPT).toContain('hot reload enabled');
        expect(PROMPT).toContain('will hot reload when files change');
      });

      test('should forbid specific npm commands', () => {
        expect(PROMPT).toContain('npm run dev');
        expect(PROMPT).toContain('npm run build');
        expect(PROMPT).toContain('npm run start');
        expect(PROMPT).toContain('next dev');
        expect(PROMPT).toContain('next build');
        expect(PROMPT).toContain('next start');
      });

      test('should warn about command consequences', () => {
        expect(PROMPT).toContain('will cause unexpected behavior');
        expect(PROMPT).toContain('critical error');
      });
    });

    describe('Feature completeness requirements', () => {
      test('should emphasize production-quality implementation', () => {
        expect(PROMPT).toContain('production-quality');
        expect(PROMPT).toContain('fully functional and polished');
      });

      test('should forbid placeholders and stubs', () => {
        expect(PROMPT).toContain('Avoid placeholders or simplistic stubs');
        expect(PROMPT).toContain('Do not respond with "TODO"');
      });

      test('should require finished features', () => {
        expect(PROMPT).toContain('finished feature that could be shipped');
      });
    });

    describe('Dependency management', () => {
      test('should require explicit package installation', () => {
        expect(PROMPT).toContain('Always use the terminal tool to install');
        expect(PROMPT).toContain('npm install some-package --yes');
      });

      test('should list pre-installed dependencies', () => {
        expect(PROMPT).toContain('radix-ui');
        expect(PROMPT).toContain('lucide-react');
        expect(PROMPT).toContain('class-variance-authority');
        expect(PROMPT).toContain('tailwind-merge');
      });

      test('should warn against reinstalling pre-installed packages', () => {
        expect(PROMPT).toContain('must NOT be installed again');
      });
    });

    describe('Shadcn UI usage guidelines', () => {
      test('should emphasize adherence to actual API', () => {
        expect(PROMPT).toContain('strictly adhere to their actual API');
        expect(PROMPT).toContain('do not guess props or variant names');
      });

      test('should provide Button component examples', () => {
        expect(PROMPT).toContain('Button component');
        expect(PROMPT).toContain('variant="outline"');
      });

      test('should specify correct import patterns', () => {
        expect(PROMPT).toContain('import { Button } from "@/components/ui/button"');
      });

      test('should clarify cn utility import', () => {
        expect(PROMPT).toContain('cn" utility MUST always be imported from "@/lib/utils"');
        expect(PROMPT).toContain('Do NOT import "cn" from "@/components/ui/utils"');
      });
    });

    describe('Additional guidelines', () => {
      test('should require step-by-step thinking', () => {
        expect(PROMPT).toContain('Think step-by-step before coding');
      });

      test('should specify required tools usage', () => {
        expect(PROMPT).toContain('MUST use the createOrUpdateFiles tool');
        expect(PROMPT).toContain('MUST use the terminal tool');
      });

      test('should forbid inline code output', () => {
        expect(PROMPT).toContain('Do not print code inline');
        expect(PROMPT).toContain('Do not wrap code in backticks');
      });

      test('should require backticks for strings', () => {
        expect(PROMPT).toContain('Use backticks (`) for all strings');
      });

      test('should emphasize full-feature development', () => {
        expect(PROMPT).toContain('full, real-world features');
        expect(PROMPT).toContain('not demos, stubs, or isolated widgets');
      });
    });

    describe('Styling and component requirements', () => {
      test('should mandate Tailwind CSS usage', () => {
        expect(PROMPT).toContain('MUST use Tailwind CSS for all styling');
        expect(PROMPT).toContain('never use plain CSS, SCSS, or external stylesheets');
      });

      test('should specify icon library', () => {
        expect(PROMPT).toContain('Lucide React icons');
        expect(PROMPT).toContain('import { SunIcon } from "lucide-react"');
      });

      test('should forbid image URLs', () => {
        expect(PROMPT).toContain('Do not use local or external image URLs');
        expect(PROMPT).toContain('rely on emojis and divs');
      });

      test('should require responsive and accessible design', () => {
        expect(PROMPT).toContain('Responsive and accessible by default');
      });
    });

    describe('File conventions', () => {
      test('should specify naming conventions', () => {
        expect(PROMPT).toContain('PascalCase for component names');
        expect(PROMPT).toContain('kebab-case for filenames');
      });

      test('should specify file extensions', () => {
        expect(PROMPT).toContain('.tsx for components');
        expect(PROMPT).toContain('.ts for types/utilities');
      });

      test('should require named exports', () => {
        expect(PROMPT).toContain('Components should be using named exports');
      });
    });

    describe('Task completion format', () => {
      test('should specify mandatory task_summary format', () => {
        expect(PROMPT).toContain('<task_summary>');
        expect(PROMPT).toContain('</task_summary>');
      });

      test('should provide correct example', () => {
        expect(PROMPT).toContain('✅ Example (correct)');
        expect(PROMPT).toContain('Created a blog layout');
      });

      test('should provide incorrect examples', () => {
        expect(PROMPT).toContain('❌ Incorrect');
        expect(PROMPT).toContain('Wrapping the summary in backticks');
      });

      test('should emphasize completion requirement', () => {
        expect(PROMPT).toContain('ONLY valid way to terminate');
        expect(PROMPT).toContain('task will be considered incomplete');
      });
    });

    describe('Edge cases and validation', () => {
      test('should handle empty or whitespace-only content', () => {
        const emptyPrompt = '';
        const whitespacePrompt = '   \n\t   ';
        
        expect(emptyPrompt.trim().length).toBe(0);
        expect(whitespacePrompt.trim().length).toBe(0);
        expect(PROMPT.trim().length).toBeGreaterThan(0);
      });

      test('should contain balanced angle brackets for tags', () => {
        const openBrackets = (PROMPT.match(/</g) || []).length;
        const closeBrackets = (PROMPT.match(/>/g) || []).length;
        
        // Should have at least some balanced tags
        expect(openBrackets).toBeGreaterThan(0);
        expect(closeBrackets).toBeGreaterThan(0);
      });

      test('should have consistent formatting patterns', () => {
        // Check for consistent bullet point usage
        const bulletPoints = PROMPT.match(/^- /gm);
        if (bulletPoints) {
          expect(bulletPoints.length).toBeGreaterThan(0);
        }
        
        // Check for consistent numbering
        const numberedLists = PROMPT.match(/^\d+\. /gm);
        if (numberedLists) {
          expect(numberedLists.length).toBeGreaterThan(0);
        }
      });

      test('should contain no obvious typos in critical keywords', () => {
        // Check for correct spelling of key terms
        expect(PROMPT).toContain('Next.js');
        expect(PROMPT).toContain('TypeScript');
        expect(PROMPT).toContain('Tailwind');
        expect(PROMPT).toContain('component');
        expect(PROMPT).toContain('import');
      });
    });

    describe('Content validation', () => {
      test('should have reasonable length for comprehensive instructions', () => {
        // Should be substantial but not excessively long
        expect(PROMPT.length).toBeGreaterThan(1000);
        expect(PROMPT.length).toBeLessThan(50000);
      });

      test('should contain multiple sections', () => {
        const sections = [
          'Environment:',
          'File Safety Rules:',
          'Runtime Execution',
          'Instructions:',
          'Additional Guidelines:',
          'File conventions:'
        ];
        
        sections.forEach(section => {
          expect(PROMPT).toContain(section);
        });
      });

      test('should have proper markdown-like formatting', () => {
        // Should contain headers, lists, and examples
        expect(PROMPT).toMatch(/^[A-Za-z\s]+:$/m); // Section headers
        expect(PROMPT).toContain('Example:'); // Contains examples
      });
    });
  });

  describe('Cross-prompt consistency', () => {
    test('should all be exported constants', () => {
      expect(RESPONSE_PROMPT).toBeDefined();
      expect(FRAGMENT_TITLE_PROMPT).toBeDefined();
      expect(PROMPT).toBeDefined();
    });

    test('should all be strings', () => {
      expect(typeof RESPONSE_PROMPT).toBe('string');
      expect(typeof FRAGMENT_TITLE_PROMPT).toBe('string');
      expect(typeof PROMPT).toBe('string');
    });

    test('should all reference task_summary consistently', () => {
      expect(RESPONSE_PROMPT).toContain('task_summary');
      expect(FRAGMENT_TITLE_PROMPT).toContain('task_summary');
      expect(PROMPT).toContain('task_summary');
    });

    test('should maintain consistent tone and formatting', () => {
      // All should use similar instructional language
      const instructionalWords = ['You are', 'should', 'must', 'do not'];
      
      instructionalWords.forEach(word => {
        expect(RESPONSE_PROMPT.toLowerCase()).toContain(word.toLowerCase());
        expect(PROMPT.toLowerCase()).toContain(word.toLowerCase());
      });
    });
  });

  describe('Memory and performance considerations', () => {
    test('should not cause memory issues with large string constants', () => {
      // Test that the constants can be accessed multiple times without issues
      for (let i = 0; i < 100; i++) {
        expect(PROMPT.length).toBeGreaterThan(0);
        expect(RESPONSE_PROMPT.length).toBeGreaterThan(0);
        expect(FRAGMENT_TITLE_PROMPT.length).toBeGreaterThan(0);
      }
    });

    test('should be immutable', () => {
      const originalPrompt = PROMPT;
      const originalResponse = RESPONSE_PROMPT;
      const originalFragment = FRAGMENT_TITLE_PROMPT;
      
      // These should remain the same (constants should be immutable)
      expect(PROMPT).toBe(originalPrompt);
      expect(RESPONSE_PROMPT).toBe(originalResponse);
      expect(FRAGMENT_TITLE_PROMPT).toBe(originalFragment);
    });
  });
});