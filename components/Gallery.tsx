'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const galleryImages = [
  { src: '/md.webp' },
  { src: '/IMG_3945.webp' },
  { src: '/IMG_3949.webp' },
  { src: '/IMG_3957.webp' },
  { src: '/IMG_3960.webp' },
]

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  useEffect(() => {
    // Load images to get their natural dimensions
    const loadImageDimensions = async () => {
      const dimensions: Record<string, { width: number; height: number }> = {}
      
      for (const img of galleryImages) {
        try {
          const imgElement = new window.Image()
          imgElement.src = img.src
          await new Promise((resolve, reject) => {
            imgElement.onload = () => {
              dimensions[img.src] = {
                width: imgElement.naturalWidth,
                height: imgElement.naturalHeight,
              }
              resolve(null)
            }
            imgElement.onerror = reject
          })
        } catch (error) {
          console.error(`Failed to load image ${img.src}:`, error)
        }
      }
      
      setImageDimensions(dimensions)
    }

    loadImageDimensions()
  }, [])

  const getImageClasses = (src: string) => {
    const dims = imageDimensions[src]
    if (!dims) return 'col-span-2 row-span-3'

    const aspectRatio = dims.width / dims.height

    // Determine column and row spans based on aspect ratio
    // Portrait images (taller): fewer cols, more rows
    // Landscape images (wider): more cols, fewer rows
    if (aspectRatio < 0.8) {
      // Very tall/portrait
      return 'col-span-1 row-span-4'
    } else if (aspectRatio < 1.0) {
      // Portrait
      return 'col-span-1 row-span-3'
    } else if (aspectRatio < 1.3) {
      // Square-ish
      return 'col-span-2 row-span-2'
    } else if (aspectRatio < 1.8) {
      // Landscape
      return 'col-span-2 row-span-2'
    } else {
      // Very wide/panoramic
      return 'col-span-3 row-span-2'
    }
  }

  const selectedIndex = selectedImage ? galleryImages.findIndex(img => img.src === selectedImage) : -1
  const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : galleryImages.length - 1
  const nextIndex = selectedIndex < galleryImages.length - 1 ? selectedIndex + 1 : 0

  return (
    <>
      <section id="gallery" className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 sm:py-20 md:py-24 px-4" aria-label="Gallery">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, rgba(31, 143, 201, 0.3), transparent)' }}></div>
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, rgba(59, 180, 232, 0.3), transparent)' }}></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="mb-8 sm:mb-12 md:mb-16 text-center animate-fade-in-up">
            <span className="mb-3 sm:mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
              Our Facility
            </span>
            <h2 className="mb-4 sm:mb-6 font-display font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              Gallery
            </h2>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-gray-600">
              A glimpse into our state-of-the-art pharmaceutical distribution facility
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="mx-auto max-w-6xl">
            {/* Desktop: 2-column grid | Mobile: 1-column grid (all images stack) */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6"
              style={{ 
                gridAutoRows: 'auto',
              }}
            >
              {galleryImages.map((item, index) => {
                const dims = imageDimensions[item.src]
                
                // Desktop layout:
                // - md.webp (index 0): col 1, spans 3 rows, width = 1 column
                // - Images 1-3 (indices 1-3): col 2, stacked vertically
                // - Image 4 (index 4): spans both columns (full width)
                
                // Mobile layout:
                // - All images stack vertically, each taking full width
                
                let colSpan = ''
                let rowSpan = ''
                
                if (index === 0) {
                  // md.webp: Mobile - full width, Desktop - 1 column, 3 rows tall
                  colSpan = 'col-span-1 md:col-span-1'
                  rowSpan = 'md:row-span-3'
                } else if (index < 4) {
                  // Images 1-3: Mobile - full width, Desktop - right column
                  colSpan = 'col-span-1 md:col-span-1'
                  rowSpan = ''
                } else {
                  // Image 4 (last): Mobile - full width, Desktop - spans both columns
                  colSpan = 'col-span-1 md:col-span-2'
                  rowSpan = ''
                }

                return (
                  <div
                    key={item.src}
                    className={`group relative overflow-hidden rounded-lg shadow-xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:z-10 animate-fade-in-up ${colSpan} ${rowSpan}`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      aspectRatio: dims ? `${dims.width} / ${dims.height}` : 'auto',
                    }}
                    onClick={() => setSelectedImage(item.src)}
                  >
                    <Image
                      src={item.src}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Hover indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close gallery"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(galleryImages[prevIndex].src)
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(galleryImages[nextIndex].src)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          >
            <div className="relative" style={{ width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw' }}>
              <img
                src={selectedImage}
                alt="Gallery image"
                className="object-contain rounded-lg shadow-2xl"
                style={{ maxWidth: '100%', maxHeight: '90vh', width: 'auto', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

