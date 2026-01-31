'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  Trophy,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Star,
  ChevronDown,
} from 'lucide-react';
import { ChatInterface } from '@/components/chat';
import { Button } from '@/components/ui';
import { eventData, speakersData, prizesData, sponsorsData } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const featuredSpeakers = speakersData.filter((s) => s.isFeatured).slice(0, 4);
  const topPrizes = prizesData.slice(0, 3);
  // Calculate total prize value (simplified - prizes are now strings)
  const totalPrizeValue = "$50,000+";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-grid-pattern opacity-50" />
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-pink-900/20" />
      
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 left-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{eventData.tagline}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="text-gradient">{eventData.name.split(' ').slice(0, -1).join(' ')}</span>
            <br />
            <span className="text-white">{eventData.name.split(' ').slice(-1)}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
          >
            {eventData.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10"
          >
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>{formatDate(eventData.dates.start)}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-5 h-5 text-pink-400" />
              <span>48 Hours</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="w-5 h-5 text-blue-400" />
              <span>{eventData.spotsTotal}+ Participants</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>{totalPrizeValue} in Prizes</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="group">
              Register Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-white/60"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Only <strong className="text-white">{eventData.spotsRemaining}</strong> spots remaining!</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/40"
          >
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-4">
              Why <span className="text-gradient">Join Us?</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/60 max-w-xl mx-auto">
              An unforgettable experience awaits you at our hackathon
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: '48 Hours', description: 'Non-stop coding, learning, and creating amazing projects', color: 'from-yellow-500 to-orange-500' },
              { icon: Users, title: 'Expert Mentors', description: 'Get guidance from industry leaders and AI experts', color: 'from-blue-500 to-cyan-500' },
              { icon: Trophy, title: '$150K+ Prizes', description: 'Compete for amazing prizes across multiple categories', color: 'from-purple-500 to-pink-500' },
              { icon: Star, title: 'Networking', description: 'Connect with 500+ developers, designers, and innovators', color: 'from-green-500 to-emerald-500' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Featured <span className="text-gradient">Speakers</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Learn from industry pioneers and AI research leaders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSpeakers.map((speaker, index) => (
              <motion.div
                key={speaker.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all text-center"
              >
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="relative w-full h-full rounded-full object-cover border-2 border-white/20"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-1">{speaker.name}</h3>
                <p className="text-purple-400 text-sm mb-2">{speaker.role}</p>
                <p className="text-white/50 text-xs">{speaker.company}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline">
              View All Speakers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Amazing <span className="text-gradient-gold">Prizes</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Compete for over {totalPrizeValue} in prizes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {topPrizes.map((prize, index) => {
              const isGrand = index === 0;
              return (
                <motion.div
                  key={prize.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative p-8 rounded-2xl border transition-all ${
                    isGrand
                      ? 'bg-gradient-to-b from-yellow-500/20 to-orange-500/10 border-yellow-500/30 scale-105'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {isGrand && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-black">
                      GRAND PRIZE
                    </div>
                  )}
                  <div className="text-center">
                    <Trophy className={`w-12 h-12 mx-auto mb-4 ${isGrand ? 'text-yellow-400' : 'text-white/60'}`} />
                    <h3 className="text-xl font-bold mb-2">{prize.title}</h3>
                    <p className={`text-3xl font-bold mb-4 ${isGrand ? 'text-gradient-gold' : 'text-gradient'}`}>
                      ${prize.value?.toLocaleString()}
                    </p>
                    <p className="text-white/60 text-sm">{prize.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Our <span className="text-gradient">Sponsors</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Partnering with industry leaders to bring you the best experience
            </p>
          </div>

          <div className="mb-12">
            <h3 className="text-center text-sm text-white/40 uppercase tracking-wider mb-6">Platinum Sponsors</h3>
            <div className="flex flex-wrap justify-center gap-8">
              {sponsorsData.filter((s) => s.tier === 'platinum').map((sponsor) => (
                <motion.div
                  key={sponsor.id}
                  whileHover={{ scale: 1.05 }}
                  className="w-32 h-16 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-4"
                >
                  <img src={sponsor.logo} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 opacity-70">
            {sponsorsData.filter((s) => s.tier !== 'platinum').slice(0, 8).map((sponsor) => (
              <motion.div
                key={sponsor.id}
                whileHover={{ scale: 1.05 }}
                className="w-24 h-12 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 p-2"
              >
                <img src={sponsor.logo} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to <span className="text-gradient">Build the Future?</span>
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">
                Join hundreds of innovators and be part of something extraordinary. Registration closes soon!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="group">
                  Register Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="ghost" size="lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  View Location
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/40 text-sm">
            © 2024 {eventData.name}. Built with Tambo AI
          </p>
        </div>
      </footer>

      <ChatInterface initialOpen={false} position="bottom-right" />
    </main>
  );
}
