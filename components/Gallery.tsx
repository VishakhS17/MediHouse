'use client'

import { useState } from 'react'
import Image from 'next/image'

const galleryImages = [
  { 
    src: '/IMG_3945.webp', 
    colSpan: 1,
    rowSpan: 2,
    aspect: '3/4'
  },
  { 
    src: '/IMG_3949.webp', 
    colSpan: 2,
    rowSpan: 1,
    aspect: '16/9'
  },
  { 
    src: '/IMG_3957.webp', 
    colSpan: 1,
    rowSpan: 1,
    aspect: '1/1'
  },
  { 
    src: '/IMG_3960.webp', 
    colSpan: 1,
    rowSpan: 2,
    aspect: '3/4'
  },
  { 
    src: '/md.webp', 
    colSpan: 2,
    rowSpan: 1,
    aspect: '16/9'
  },
]

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <>
      <section id="gallery" className="relative overflow-hidden py-12 sm:py-16 md:py-20 px-4" aria-label="Photo Gallery">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-ocean-aqua/20 to-ocean-sky/10"></div>
        
        {/* Decorative gradient stripes */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, #7AD3F6, transparent)' }}></div>
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, #A8D8F0, transparent)' }}></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="mb-8 sm:mb-12 md:mb-16 text-center animate-fade-in-up px-2">
            <span className="mb-3 sm:mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
              Our Facilities
            </span>
            <h2 className="mb-4 sm:mb-6 font-display font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              Photo <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Gallery</span>
            </h2>
            <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 px-2">
              Take a look at our facilities and operations. We take pride in maintaining state-of-the-art infrastructure for pharmaceutical distribution.
            </p>
          </div>

          {/* Poster Wall - Perfect Grid Alignment */}
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoRows: '250px' }}>
              {galleryImages.map((item, index) => {
                const colSpanClasses = {
                  1: 'col-span-1',
                  2: 'col-span-2',
                  3: 'col-span-3',
                  4: 'col-span-4',
                }[item.colSpan] || 'col-span-1'
                
                const rowSpanClasses = {
                  1: 'row-span-1',
                  2: 'row-span-2',
                  3: 'row-span-3',
                  4: 'row-span-4',
                }[item.rowSpan] || 'row-span-1'
                
                return (
                  <div
                    key={item.src}
                    className={`group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:z-10 animate-fade-in-up ${colSpanClasses} ${rowSpanClasses}`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                    }}
                    onClick={() => setSelectedImage(item.src)}
                  >
                    <Image
                      src={item.src}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    
                    {/* Hover Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="rounded-full bg-white/90 p-4 shadow-xl backdrop-blur-sm">
                        <svg
                          className="h-8 w-8 text-ocean-royal"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Border Glow Effect */}
                    <div className="absolute inset-0 rounded-lg border-2 border-ocean-cyan/0 transition-all duration-500 group-hover:border-ocean-cyan/50"></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close gallery"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image */}
          <div className="relative max-h-[90vh] max-w-[90vw] animate-scale-in">
            <Image
              src={selectedImage}
              alt="Gallery image"
              width={1200}
              height={900}
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const currentIndex = galleryImages.findIndex(img => img.src === selectedImage)
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : galleryImages.length - 1
              setSelectedImage(galleryImages[prevIndex].src)
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Previous image"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              const currentIndex = galleryImages.findIndex(img => img.src === selectedImage)
              const nextIndex = currentIndex < galleryImages.length - 1 ? currentIndex + 1 : 0
              setSelectedImage(galleryImages[nextIndex].src)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Next image"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
