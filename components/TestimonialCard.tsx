interface Testimonial {
  name: string
  role?: string
  company?: string
  content: string
  rating?: number
}

interface TestimonialCardProps {
  testimonial: Testimonial
  index: number
}

export default function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <div 
      className="group relative h-full animate-fade-in-up rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:bg-white/15 hover:shadow-2xl"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Glass glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      
      {/* Quote Icon */}
      <div className="absolute top-6 right-6 text-white/20 transition-all duration-300 group-hover:scale-110 group-hover:text-white/30">
        <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Rating */}
        {testimonial.rating && (
          <div className="mb-4 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-5 w-5 transition-colors duration-300 ${i < testimonial.rating! ? 'text-yellow-400' : 'text-white/30'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}

        {/* Testimonial Text */}
        <p className="mb-6 text-lg leading-relaxed text-white/90 italic">
          "{testimonial.content}"
        </p>

        {/* Author Info */}
        <div className="border-t border-white/20 pt-6">
          <div className="font-bold text-white">{testimonial.name}</div>
          {(testimonial.role || testimonial.company) && (
            <div className="mt-1 text-sm text-white/70">
              {testimonial.role && <span>{testimonial.role}</span>}
              {testimonial.role && testimonial.company && <span> at </span>}
              {testimonial.company && <span className="font-semibold">{testimonial.company}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

