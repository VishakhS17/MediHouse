import { Service } from '@/data/site'

interface FeatureCardProps {
  service: Service
}

export default function FeatureCard({ service }: FeatureCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white p-8 shadow-lg transition-all duration-500 hover:-translate-y-4 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-ocean-cyan/50" style={{ boxShadow: '0 0 0 0 rgba(59, 180, 232, 0), 0 0 0 0 rgba(31, 143, 201, 0)' }}>
      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-xl border-2 opacity-0 transition-all duration-500 group-hover:opacity-100" style={{ borderColor: 'rgba(59, 180, 232, 0.5)' }}></div>
      
      {/* Animated Background Gradient with new colors */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: 'linear-gradient(to bottom right, rgba(122, 211, 246, 0.1), rgba(168, 216, 240, 0.05), rgba(59, 180, 232, 0.1))' }}></div>
      
      {/* Hover Glow Effect with new colors */}
      <div className="absolute -inset-2 rounded-xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" style={{ background: 'radial-gradient(circle, rgba(59, 180, 232, 0.4), rgba(31, 143, 201, 0.2))' }}></div>
      <div className="absolute -inset-1 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30" style={{ background: 'radial-gradient(circle, rgba(122, 211, 246, 0.3), rgba(59, 180, 232, 0.2))' }}></div>
      
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Icon Container with new gradient */}
        <div className="mb-6 inline-block self-start rounded-2xl p-4 shadow-md transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #A8D8F0, #7AD3F6)', boxShadow: '0 4px 15px rgba(59, 180, 232, 0.3)' }}>
          <div className="text-5xl transition-transform duration-500 group-hover:scale-110" role="img" aria-label={service.title}>
            {service.icon}
          </div>
        </div>
        
        <h3 className="mb-4 text-2xl font-bold text-gray-900 transition-all duration-500 group-hover:scale-105" style={{ color: 'inherit' }}>
          <span className="bg-gradient-to-r from-ocean-royal via-ocean-teal to-ocean-cyan bg-clip-text text-transparent group-hover:from-ocean-cyan group-hover:via-ocean-teal group-hover:to-ocean-royal transition-all duration-500">
            {service.title}
          </span>
        </h3>
        <p className="leading-relaxed text-gray-700 transition-colors duration-500 group-hover:text-gray-900">
          {service.description}
        </p>
      </div>
    </div>
  )
}

