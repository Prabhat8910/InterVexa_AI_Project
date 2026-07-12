import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, 
  Users, 
  GraduationCap, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const Landing: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const ecosystems = [
    {
      title: 'For Students',
      subtitle: 'Advance Your Preparation',
      icon: <Mic className="h-6 w-6 text-brandPrimary" />,
      features: [
        'Personalized Voice Mock Experience',
        'Direct Resume-Based Questions',
        'Dynamic Answer Difficulty Scaling',
        'Low-Latency LiveKit Voice Streaming',
        'Actionable AI Evaluation Metrics'
      ]
    },
    {
      title: 'For Universities',
      subtitle: 'Empower Cohorts',
      icon: <GraduationCap className="h-6 w-6 text-brandSecondary" />,
      features: [
        'Student Readiness Trackers',
        'Large Scale Placement Analytics',
        'Spontaneous Speech Assessments',
        'Departmental Progress Audits',
        'Bulk Results Report Export'
      ]
    },
    {
      title: 'For Recruiters',
      subtitle: 'Accelerate Screening',
      icon: <Users className="h-6 w-6 text-brandAccent" />,
      features: [
        'ATS Ranking Filter',
        'Automatic Performance Scoring',
        'Detailed Communication Audits',
        'AI Hiring Suitability Recommendation',
        'Instant Candidate Pre-Screening'
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-darkBg text-white overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-brandPrimary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-brandSecondary/10 blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-300 mb-6"
        >
          <Zap className="h-3 w-3 text-brandSecondary animate-pulse" />
          <span>Driven by LiveKit & Groq API</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl font-sans"
        >
          Accelerate Your Placement <br />
          <span className="gradient-text">Preparation with Voice AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-textMuted md:text-xl"
        >
          Realistic voice mock interviews, instant resume ATS audits, and tailored roadmap advisor services hosted in high-fidelity low-latency LiveKit rooms.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link 
            to="/register" 
            className="flex items-center space-x-2 rounded-xl bg-brandPrimary px-8 py-4 font-semibold text-white shadow-lg shadow-brandPrimary/30 transition hover:bg-brandPrimary/80"
          >
            <span>Start Mock Interview</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a 
            href="#ecosystem" 
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Explore Ecosystem
          </a>
        </motion.div>
      </section>

      {/* Feature Ecosystem Section */}
      <section id="ecosystem" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Unified Platform Ecosystems</h2>
          <p className="mt-4 text-textMuted">Tailored tools designed specifically for students, coordinators, and corporate recruiters.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {ecosystems.map((eco) => (
            <motion.div
              key={eco.title}
              variants={itemVariants}
              className="rounded-2xl glass-panel glass-panel-hover p-8 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6">
                  {eco.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{eco.title}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-6 block">{eco.subtitle}</span>
                
                <ul className="space-y-3.5 mb-8">
                  {eco.features.map((feat) => (
                    <li key={feat} className="flex items-start space-x-3 text-sm text-gray-300">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-brandAccent mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link 
                to="/register" 
                className="flex items-center space-x-1.5 text-sm font-semibold text-brandPrimary hover:text-white transition"
              >
                <span>Join ecosystem</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="mx-auto max-w-7xl px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <h4 className="text-4xl font-extrabold text-white">45ms</h4>
            <p className="mt-2 text-sm text-textMuted">Average Latency</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <h4 className="text-4xl font-extrabold text-white">94%</h4>
            <p className="mt-2 text-sm text-textMuted">Placement Success</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <h4 className="text-4xl font-extrabold text-white">12,000+</h4>
            <p className="mt-2 text-sm text-textMuted">Mock Interviews</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
            <h4 className="text-4xl font-extrabold text-white">850+</h4>
            <p className="mt-2 text-sm text-textMuted">ATS Keywords Optimized</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-lg font-semibold text-white">How does the Voice Mock Interview work?</h4>
            <p className="mt-2 text-sm text-textMuted">Once connected, a LiveKit room is allocated and our AI interviewer participant greets you. When you speak, your microphone is streamed directly to Groq. Silence boundary limits are auto-detected, generating the next follow-up question dynamically.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-lg font-semibold text-white">Can recruiters review my mock reports?</h4>
            <p className="mt-2 text-sm text-textMuted">Yes! If you connect through a university domain or release your profile, corporate recruiters can search candidate matrices, review confidence/competency trends, and read the turn-by-turn evaluation sheets.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-lg font-semibold text-white">What models does the platform run on?</h4>
            <p className="mt-2 text-sm text-textMuted">We utilize the Groq API: Whisper-large-v3 for Speech-To-Text (STT), Llama 3.1 70B for conversation evaluation and ATS audits, and Canopy Labs Orpheus models for Text-To-Speech (TTS) generation.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Landing;
