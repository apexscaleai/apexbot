"use client";

import { APEX_BRAND } from "../lib/constants";

interface HeaderProps {
  onChatOpen: () => void;
}

export default function Header({ onChatOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-apex-dark/80 backdrop-blur-lg border-b border-apex-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
            <span className="text-xl font-bold text-apex-heading">
              {APEX_BRAND.name}
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-apex-text hover:text-apex-heading transition-colors"
            >
              Features
            </a>
            <a 
              href="#process" 
              className="text-apex-text hover:text-apex-heading transition-colors"
            >
              Process
            </a>
            <button
              onClick={onChatOpen}
              className="btn btn-primary"
            >
              Try Lexy
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={onChatOpen}
            className="md:hidden btn btn-primary"
          >
            Try Lexy
          </button>
        </div>
      </div>
    </header>
  );
}