import { FC } from "react";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

const Footer: FC = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          {/* Left: Brand & Copyright */}
          <div className="flex items-center space-x-2 text-center sm:text-left mb-4 sm:mb-0">
            <Link
              href="/"
              className="text-xl font-bold text-foreground hover:text-primary transition-colors font-serif"
            >
              Lovibe
            </Link>
          </div>

          {/* Center: Made with love */}
          <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Made with ❤️ by Ashwin Pulipati
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="https://github.com/Ashwin-Pulipati/lovibe"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github size={20} />
            </Link>
            <Link
              href="https://www.linkedin.com/in/ashwinpulipati/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
