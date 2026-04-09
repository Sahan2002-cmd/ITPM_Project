import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Users, BookOpen, Award, Clock, TrendingUp, 
  ChevronLeft, ChevronRight, CheckCircle2, Star, ArrowRight,
  MessageSquare, Video, Calendar, Shield
} from 'lucide-react';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1718327453695-4d32b94c90a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMGxpYnJhcnl8ZW58MXx8fHwxNzc0NzA0OTUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Connect with Peer Tutors',
    description: 'Access experienced student tutors across all subjects, available 24/7 for personalized learning sessions.'
  },
  {
    image: 'https://images.unsplash.com/photo-1771765780945-c788a6ce4b33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjbGFzc3Jvb20lMjBlZHVjYXRpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3NDc2NTYwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Modern Learning Tools',
    description: 'Real-time chat, video sessions, file sharing, and session recordings all in one integrated platform.'
  },
  {
    image: 'https://images.unsplash.com/photo-1629360021730-3d258452c425?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHR1dG9yJTIwc3R1ZGVudHxlbnwxfHx8fDE3NzQ3NjU2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Flexible Scheduling',
    description: 'Book sessions at your convenience with easy-to-use calendar management and instant confirmations.'
  },
  {
    image: 'https://images.unsplash.com/photo-1631599143419-ea8539ed4fbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzc0NzEyNzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'SLIIT Excellence',
    description: 'Built by students, for students. Experience the future of peer-to-peer learning at Sri Lanka Institute of Information Technology.'
  },
  {
    image: 'https://images.unsplash.com/photo-1769092992447-18050cf9bd26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGNvbGxhYm9yYXRpb24lMjBncm91cCUyMHN0dWR5fGVufDF8fHx8MTc3NDc2NTYwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Collaborative Learning',
    description: 'Join a community of learners and tutors working together to achieve academic excellence.'
  }
];

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Expert Tutors',
    description: 'Connect with verified peer tutors excelling in their subjects',
    color: 'violet'
  },
  {
    icon: Calendar,
    title: 'Easy Booking',
    description: 'Simple scheduling with instant confirmation and reminders',
    color: 'blue'
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Communicate seamlessly during and after sessions',
    color: 'emerald'
  },
  {
    icon: Video,
    title: 'Session Recordings',
    description: 'Review your sessions anytime with automatic recordings',
    color: 'rose'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Safe transactions with Stripe integration',
    color: 'amber'
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'Rating system ensures high-quality learning experiences',
    color: 'indigo'
  }
];

const STATS = [
  { value: '1,284', label: 'Active Students', icon: Users },
  { value: '247', label: 'Verified Tutors', icon: GraduationCap },
  { value: '3,567', label: 'Sessions Completed', icon: BookOpen },
  { value: '4.8/5', label: 'Average Rating', icon: Star }
];

const TESTIMONIALS = [
  {
    name: 'Amal Perera',
    role: 'Computer Science Student',
    image: 'https://i.pravatar.cc/150?img=12',
    text: 'PeerLearn helped me improve my programming skills significantly. The tutors are knowledgeable and patient.',
    rating: 5
  },
  {
    name: 'Sanduni Silva',
    role: 'Business Analytics Student',
    image: 'https://i.pravatar.cc/150?img=45',
    text: 'The flexible scheduling and quality of tutoring made it easy to balance my studies and part-time work.',
    rating: 5
  },
  {
    name: 'Kasun Fernando',
    role: 'Engineering Student',
    image: 'https://i.pravatar.cc/150?img=33',
    text: 'Session recordings are a game-changer! I can review difficult concepts whenever I need to.',
    rating: 5
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">PeerLearn</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">SLIIT Tutoring Platform</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Image Carousel */}
      <section className="relative h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/90 via-indigo-900/90 to-slate-900/90 z-10" />
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                {HERO_SLIDES[currentSlide].title}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-3xl mx-auto">
                {HERO_SLIDES[currentSlide].description}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-4">
          <button
            onClick={prevSlide}
            className="p-2 bg-white/20 backdrop-blur-lg text-white rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 bg-white/20 backdrop-blur-lg text-white rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our platform provides comprehensive tools for both tutors and students to create the perfect learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-violet-500/10 transition-all group"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-200 dark:from-${feature.color}-900/30 dark:to-${feature.color}-800/30 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by Students
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              See what our community has to say about their learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Join thousands of students and tutors on the PeerLearn platform today
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-2xl hover:scale-105 inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">PeerLearn</span>
              </div>
              <p className="text-slate-400 text-sm">
                SLIIT's premier peer tutoring platform connecting students for academic success.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3">Platform</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Browse Tutors</li>
                <li>Become a Tutor</li>
                <li>How It Works</li>
                <li>Pricing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQs</li>
                <li>Guidelines</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
            <p>© 2026 PeerLearn - SLIIT IT3040 Project. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
