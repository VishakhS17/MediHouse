import { Service } from '@/data/site'

interface FeatureCardProps {
  service: Service
}

export default function FeatureCard({ service }: FeatureCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white p-8 shadow-lg transition-all duration-500 hover:-translate-y-4 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/40 border-2 border-transparent hover:border-primary-300">
      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-xl border-2 border-primary-400/0 transition-all duration-500 group-hover:border-primary-400/50"></div>
      
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-100/0 to-primary-200/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
      
      {/* Hover Glow Effect - Stronger */}
      <div className="absolute -inset-2 rounded-xl bg-gradient-to-br from-primary-400/0 to-primary-600/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"></div>
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary-300/0 to-primary-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30"></div>
      
      {/* Animated Shine Effect */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Icon Container */}
        <div className="mb-6 inline-block self-start rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 p-4 shadow-md transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl group-hover:shadow-primary-500/50">
          <div className="text-5xl transition-transform duration-500 group-hover:scale-110" role="img" aria-label={service.title}>
            {service.icon}
          </div>
        </div>
        
        <h3 className="mb-4 text-2xl font-bold text-gray-900 transition-all duration-500 group-hover:text-primary-700 group-hover:scale-105">
          {service.title}
        </h3>
        <p className="leading-relaxed text-gray-700 transition-colors duration-500 group-hover:text-gray-900">
          {service.description}
        </p>
      </div>
    </div>
  )
}

