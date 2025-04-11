import RecommendationsSection from "@/components/recommendations/RecommendationsSection";

export default function Recommendations() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-800">Sustainable Recommendations</h1>
        <p className="text-neutral-600 mt-1">Actionable suggestions to improve your environmental impact</p>
      </div>

      {/* Recommendations section */}
      <RecommendationsSection />
      
      {/* Additional sustainability tips */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
        <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-4">General Sustainability Tips</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0 bg-primary bg-opacity-10 p-2 h-10 w-10 flex items-center justify-center rounded-lg">
              <i className="ri-leaf-line text-xl text-primary"></i>
            </div>
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-1">Shop Local and Seasonal</h3>
              <p className="text-sm text-neutral-600">Buying local, seasonal produce reduces transportation emissions and supports local communities.</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-shrink-0 bg-secondary bg-opacity-10 p-2 h-10 w-10 flex items-center justify-center rounded-lg">
              <i className="ri-recycle-line text-xl text-secondary"></i>
            </div>
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-1">Reduce, Reuse, Recycle</h3>
              <p className="text-sm text-neutral-600">Minimize waste by buying less, reusing what you have, and properly recycling materials.</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-shrink-0 bg-accent bg-opacity-10 p-2 h-10 w-10 flex items-center justify-center rounded-lg">
              <i className="ri-car-line text-xl text-accent"></i>
            </div>
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-1">Sustainable Transportation</h3>
              <p className="text-sm text-neutral-600">Choose public transport, carpooling, or cycling when possible to reduce your carbon footprint.</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-shrink-0 bg-primary-light bg-opacity-10 p-2 h-10 w-10 flex items-center justify-center rounded-lg">
              <i className="ri-bank-card-line text-xl text-primary-light"></i>
            </div>
            <div>
              <h3 className="text-md font-semibold text-neutral-800 mb-1">Sustainable Banking</h3>
              <p className="text-sm text-neutral-600">Consider switching to banks that invest in sustainable and ethical projects.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
