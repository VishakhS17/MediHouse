import { companyInfo } from '@/data/site'

export default function ValuesSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-gradient-to-b from-white via-primary-50/20 to-white py-24 px-4" aria-label="Our Values">
      <div className="container-custom relative z-10">
        <div className="mb-16 text-center animate-fade-in-up">
          <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
            Our Commitment
          </span>
          <h2 className="mb-6 font-display font-bold text-gray-900">
            Our <span className="gradient-text">Values</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
            {companyInfo.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {companyInfo.values.map((value, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-500/20 border border-primary-100 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-2xl font-bold text-primary-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                {value.title.charAt(0)}
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900 transition-colors duration-300 group-hover:text-primary-700">{value.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center animate-fade-in-up-delay">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 p-8 shadow-lg border border-primary-200/50">
            <h3 className="mb-4 text-2xl font-display font-bold text-gray-900">Our Vision</h3>
            <p className="text-lg italic text-primary-800">&ldquo;{companyInfo.vision}&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  )
}

