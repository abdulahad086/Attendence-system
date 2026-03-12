import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, CheckCircle2, ShieldCheck, BarChart3, Users, 
  ArrowRight, Zap, Globe, Lock, PlayCircle 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-900 text-white selection:bg-primary-500/30">
      {/* ── Navbar ────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-surface-900/80 backdrop-blur-md border-b border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Cpu size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AttendAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white">Login</button>
            <button onClick={() => navigate('/login')} className="btn-primary py-2 px-5 text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider">
              <Zap size={14} /> Next Gen Face Recognition
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Attendance Management <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                Powered by AI.
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Experience the future of workplace management. Secure, touchless, and 
              99.9% accurate face recognition system built for modern organizations.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary py-4 px-8 rounded-2xl text-lg flex items-center gap-2 group"
              >
                Launch App <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-2xl bg-surface-800 border border-surface-700 hover:bg-surface-700 transition-all font-semibold flex items-center gap-2">
                <PlayCircle size={20} /> Watch Demo
              </button>
            </div>
          </div>

          <div className="relative lg:block animate-fade-in delay-200">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/40 border border-surface-700">
              <img 
                src="/Users/mac/.gemini/antigravity/brain/931321e9-fcdd-44f5-af33-6c7d4361b085/saas_hero_image_1773314770875.png" 
                alt="AI Face Recognition" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 to-transparent" />
            </div>
            {/* Floating Glass Cards */}
            <div className="absolute -bottom-6 -left-6 bg-surface-800/80 backdrop-blur-xl p-4 rounded-2xl border border-surface-600 shadow-xl max-w-[240px] hidden md:block animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Accuracy Rate</p>
                  <p className="text-lg font-bold">99.87%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-surface-800/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl font-bold text-white uppercase tracking-widest text-sm">Features</h2>
            <h3 className="text-4xl lg:text-5xl font-bold">Built for scale, designed for speed.</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <Zap className="text-amber-400" />,
                title: "Real-time Recognition",
                desc: "Identify employees in milliseconds with our lightning-fast ArcFace engine."
              },
              {
                icon: <BarChart3 className="text-primary-400" />,
                title: "Deep Analytics",
                desc: "Export detailed reports, track daily trends, and manage punctuality trends."
              },
              {
                icon: <ShieldCheck className="text-emerald-400" />,
                title: "Enterprise Security",
                desc: "Privacy-first architecture with end-to-end encryption for all biometric data."
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-surface-900 border border-surface-700 hover:border-primary-500/50 transition-all hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h4 className="text-xl font-bold mb-3">{f.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-32 grid lg:grid-cols-2 gap-16 items-center">
             <div className="rounded-3xl overflow-hidden border border-surface-700 shadow-2xl">
                <img 
                  src="/Users/mac/.gemini/antigravity/brain/931321e9-fcdd-44f5-af33-6c7d4361b085/saas_feature_analytics_1773314789612.png" 
                  alt="Analytics Dashboard" 
                />
             </div>
             <div className="space-y-6">
                <h3 className="text-4xl font-bold">Data-driven decisions for your people.</h3>
                <p className="text-gray-400 leading-relaxed">
                  Stop guessing. Our automated reporting system gives you a complete 
                  overview of attendance trends, department performance, and employee 
                  engagement across your entire organization.
                </p>
                <ul className="space-y-4 pt-4 text-sm font-medium">
                   <li className="flex items-center gap-3"><CheckCircle2 className="text-primary-500" size={18} /> Daily automated attendance logs</li>
                   <li className="flex items-center gap-3"><CheckCircle2 className="text-primary-500" size={18} /> Department-wise performance tracking</li>
                   <li className="flex items-center gap-3"><CheckCircle2 className="text-primary-500" size={18} /> One-click CSV/PDF export</li>
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl font-bold text-white uppercase tracking-widest text-sm">Pricing</h2>
            <h3 className="text-4xl font-bold">Simple, transparent plans.</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic",
                price: "Free",
                desc: "Perfect for small teams.",
                features: ["Up to 10 employees", "1 Camera setup", "Basic analytics", "Email support"]
              },
              {
                name: "Standard",
                price: "$49",
                priceSub: "/month",
                popular: true,
                desc: "Best for growing businesses.",
                features: ["Up to 100 employees", "5 Camera setups", "Advanced analytics", "Priority support"]
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For large organizations.",
                features: ["Unlimited employees", "Unlimited cameras", "API access", "Dedicated Account Manager"]
              }
            ].map((p, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border transition-all ${p.popular ? 'bg-primary-600/10 border-primary-500 shadow-xl shadow-primary-900/20 scale-105 z-10' : 'bg-surface-800 border-surface-700 hover:border-surface-600'}`}>
                {p.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h4 className="text-xl font-bold mb-2">{p.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    {p.priceSub && <span className="text-gray-400">{p.priceSub}</span>}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">{p.desc}</p>
                </div>
                <ul className="space-y-4 mb-10 text-sm">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 size={16} className="text-primary-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-2xl font-bold transition-all ${p.popular ? 'bg-primary-600 hover:bg-primary-500' : 'bg-surface-700 hover:bg-surface-600'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-10">
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight">Ready to modernize your office?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join 500+ forward-thinking companies already using AttendAI to automate their workforce management.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-6">
            <button onClick={() => navigate('/login')} className="btn-primary py-5 px-10 text-xl rounded-3xl">Get Started Now</button>
            <button className="px-10 py-5 text-xl font-bold text-white border border-surface-700 rounded-3xl hover:bg-surface-800 transition-all">Talk to Sales</button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────────── */}
      <footer className="py-20 bg-surface-900 border-t border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Cpu size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">AttendAI</span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
              The world's most advanced facial recognition attendance platform. 
              Built for speed, privacy, and scale.
            </p>
            <div className="flex items-center gap-6 text-gray-400">
              <Globe size={20} className="hover:text-primary-400 cursor-pointer" />
              <Lock size={20} className="hover:text-primary-400 cursor-pointer" />
              <Users size={20} className="hover:text-primary-400 cursor-pointer" />
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold text-white">Product</h5>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary-400">Features</a></li>
              <li><a href="#" className="hover:text-primary-400">Security</a></li>
              <li><a href="#" className="hover:text-primary-400">Enterprise</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold text-white">Company</h5>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary-400">About</a></li>
              <li><a href="#" className="hover:text-primary-400">Contact</a></li>
              <li><a href="#" className="hover:text-primary-400">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-10 border-t border-surface-800 flex justify-between items-center text-xs text-gray-600">
          <p>© 2026 AttendAI Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
