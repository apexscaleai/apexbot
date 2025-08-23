"use client";

import { APEX_BRAND } from "../lib/constants";

interface HeroProps {
  onChatOpen: () => void;
}

export default function Hero({ onChatOpen }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-bg"></div>
      
      <div className="container relative">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-apex-heading mb-6 leading-tight">
            Where{" "}
            <span className="text-gradient">Conversation</span>
            <br />
            Meets{" "}
            <span className="text-gradient">Conversion</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-apex-text mb-8 max-w-3xl mx-auto leading-relaxed">
            {APEX_BRAND.description} Experience our unified text and voice agent below 
            and discover how Lexy can transform your customer interactions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onChatOpen}
              className="btn btn-primary btn-large pulse-glow"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.014 8.014 0 01-2.84-.508l-5.58 2.14a.507.507 0 01-.638-.642l2.14-5.58A8.012 8.012 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              Try Lexy Now
            </button>
            
            <a
              href="#features"
              className="btn btn-secondary btn-large"
            >
              Learn More
            </a>
          </div>
          
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-apex-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-spring mb-2">24/7</div>
              <div className="text-sm text-apex-text">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-spring mb-2">50%</div>
              <div className="text-sm text-apex-text">Faster Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-spring mb-2">3-6mo</div>
              <div className="text-sm text-apex-text">ROI Timeline</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-spring mb-2">∞</div>
              <div className="text-sm text-apex-text">Scalability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}