import Image from 'next/image'
import { Partner } from '@/data/site'

interface PartnersGridProps {
  partners: Partner[]
}

export default function PartnersGrid({ partners }: PartnersGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
      {partners.map((partner, index) => (
        <div
          key={partner.name}
          className="group relative flex flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 p-3 sm:p-4 md:p-6 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-white/20 hover:bg-white/15 hover:border-white/30 animate-fade-in-up min-h-[100px] sm:min-h-[120px] md:min-h-[140px]"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Glass-morphic inner box with blue shadow */}
          <div className="relative z-10 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-md p-3 sm:p-4 md:p-6 w-full h-full shadow-[0_8px_32px_rgba(255,255,255,0.3)] border border-white/30 transition-all duration-300 group-hover:shadow-[0_12px_48px_rgba(255,255,255,0.5)] group-hover:scale-105 group-hover:bg-white/30">
            <div className="relative w-full h-full min-h-[60px] sm:min-h-[80px] md:min-h-[100px]">
              <Image
                src={partner.logo}
                alt={partner.alt}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
        </div>
      ))}
    </div>
  )
}

