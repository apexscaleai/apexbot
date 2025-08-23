"use client";

export default function Process() {
  const steps = [
    {
      number: "01",
      title: "Discovery & Analysis",
      description: "We dive deep into your business goals, customer journey, and operational workflows to identify the highest-impact automation opportunities and create a custom strategy.",
    },
    {
      number: "02", 
      title: "Design & Development",
      description: "We architect and construct your custom AI agent, engineering its personality, knowledge base, and conversational logic for peak performance and seamless brand alignment.",
    },
    {
      number: "03",
      title: "Deploy & Optimize",
      description: "We seamlessly integrate the agent into your website and systems, then continuously monitor interactions to refine and enhance effectiveness over time.",
    },
  ];

  return (
    <section id="process" className="section-padding border-t border-apex-border">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider">
            Our Method
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-apex-heading mt-4 mb-6">
            From Concept to Conversion
          </h2>
          <p className="text-xl text-apex-text max-w-3xl mx-auto">
            Our proven three-step process ensures your AI assistant delivers maximum ROI 
            while seamlessly integrating with your existing business operations.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row items-start lg:items-center gap-8 p-8 glass-effect rounded-xl hover:bg-apex-card/70 transition-all duration-300"
            >
              {/* Step number */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-apex-heading mb-4">
                  {step.title}
                </h3>
                <p className="text-apex-text text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block flex-shrink-0 text-primary-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="glass-effect rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-apex-heading mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-apex-text mb-6">
              Schedule a free consultation to discuss your specific needs and see how 
              Lexy can transform your customer interactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary btn-large">
                Schedule Free Consultation
              </button>
              <button className="btn btn-secondary btn-large">
                View Case Studies
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}