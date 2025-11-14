import { companyInfo } from '@/data/site'

export default function ValuesSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-gradient-to-b from-white via-ocean-aqua/20 to-ocean-sky/10 py-24 px-4" aria-label="Our Values">
      {/* Angular Geometric Border at Top */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path 
            d="M0,0 L0,80 L150,100 L300,120 L450,110 L600,130 L750,115 L900,135 L1050,125 L1200,140 L1200,0 Z" 
            fill="#ffffff" 
            opacity="1"
          />
          <path 
            d="M0,0 L0,60 L200,85 L400,105 L600,95 L800,115 L1000,105 L1200,125 L1200,0 Z" 
            fill="#f8fafc" 
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Diagonal Stripe Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-8">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 50px,
            rgba(168, 216, 240, 0.06) 50px,
            rgba(168, 216, 240, 0.06) 100px
          )`
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full" style={{
          background: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 70px,
            rgba(122, 211, 246, 0.05) 70px,
            rgba(122, 211, 246, 0.05) 140px
          )`
        }}></div>
      </div>

      {/* Angular Geometric Border at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path 
            d="M0,200 L0,120 L150,100 L300,80 L450,90 L600,70 L750,85 L900,65 L1050,75 L1200,60 L1200,200 Z" 
            fill="#ffffff" 
            opacity="1"
          />
          <path 
            d="M0,200 L0,140 L200,115 L400,95 L600,105 L800,85 L1000,95 L1200,75 L1200,200 Z" 
            fill="#f8fafc" 
            opacity="0.9"
          />
        </svg>
      </div>

      <div className="container-custom relative z-10">
        <div className="mb-16 text-center animate-fade-in-up">
          <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-4 py-2 text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
            Our Commitment
          </span>
          <h2 className="mb-6 font-display font-bold text-gray-900">
            Our <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Values</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
            {companyInfo.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {companyInfo.values.map((value, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                borderColor: 'rgba(168, 216, 240, 0.3)',
                boxShadow: '0 4px 6px rgba(59, 180, 232, 0.1)'
              }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, #A8D8F0, #7AD3F6)' }}>
                {value.title.charAt(0)}
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900 transition-colors duration-300">
                <span className="bg-gradient-to-r from-ocean-royal via-ocean-teal to-ocean-cyan bg-clip-text text-transparent group-hover:from-ocean-cyan group-hover:via-ocean-teal group-hover:to-ocean-royal transition-all duration-300">
                  {value.title}
                </span>
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center animate-fade-in-up-delay">
          <div className="mx-auto max-w-3xl rounded-2xl p-8 shadow-lg border" style={{ 
            background: 'linear-gradient(135deg, rgba(168, 216, 240, 0.2), rgba(122, 211, 246, 0.15))',
            borderColor: 'rgba(59, 180, 232, 0.3)'
          }}>
            <h3 className="mb-4 text-2xl font-display font-bold bg-gradient-to-r from-ocean-royal via-ocean-teal to-ocean-cyan bg-clip-text text-transparent">Our Vision</h3>
            <p className="text-lg italic text-ocean-royal">&ldquo;{companyInfo.vision}&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  )
}

