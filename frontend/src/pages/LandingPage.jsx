import { ShieldCheck, Mic, Map, ArrowRight, Activity } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-accent-100 selection:text-accent-700">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold">
            +
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">ArogyaPath</span>
        </div>
        <button 
          onClick={onStart}
          className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-accent-600 transition-colors"
        >
          Skip to App <ArrowRight size={16} />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 text-accent-700 text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-600"></span>
          </span>
          Live Hackathon Prototype
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          Know <span className="text-accent-500">where to go</span>, <br className="hidden md:block" />
          not just what's wrong.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          An AI-powered, multilingual health navigator designed for rural and semi-urban communities. We safely guide you to the right care—emergency, specialist, or home care—in your own language.
        </p>
        
        <button 
          onClick={onStart}
          className="bg-accent-500 hover:bg-accent-600 text-white text-lg font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 mx-auto"
        >
          Start Symptom Check <ArrowRight size={20} />
        </button>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why ArogyaPath is Different</h2>
            <p className="text-gray-500 max-w-xl mx-auto">We don't diagnose. We navigate. Built with a safety-first architecture to ensure reliable and auditable medical routing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600 mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hybrid Safety Engine</h3>
              <p className="text-gray-500 leading-relaxed">
                Emergencies are detected by a deterministic rules engine, ensuring life-threatening symptoms are escalated instantly without relying purely on probabilistic AI.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                <Mic size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Voice-First \& Multilingual</h3>
              <p className="text-gray-500 leading-relaxed">
                Speak your symptoms in Hindi, Bengali, or Assamese. Powered by browser-native Web Speech API for zero-latency, accessible interactions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-6">
                <Map size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Facility Routing</h3>
              <p className="text-gray-500 leading-relaxed">
                Once triaged, ArogyaPath maps you to the nearest appropriate Primary Health Centre, hospital, or specific specialist clinic using live geolocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <footer className="container mx-auto px-6 py-8 text-center border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
          <Activity size={18} />
          <span className="font-medium text-sm">Built for Hackathon Demo</span>
        </div>
        <p className="text-xs text-gray-400 max-w-lg mx-auto">
          ArogyaPath is a navigation tool and does not provide medical diagnoses. In case of a severe medical emergency, always contact local emergency services immediately.
        </p>
      </footer>
    </div>
  );
}