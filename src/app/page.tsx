"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  MessageSquare,
  BarChart3,
  Globe,
  Settings2,
  Facebook,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    title: "Atención Automatizada",
    description: "Responde a tus clientes de forma automática y guía la conversación para tomar pedidos sin intervención constante.",
    icon: Globe,
  },
  {
    title: "Gestion de Pedidos",
    description: "Recibe y organiza órdenes en tiempo real desde un solo panel, con seguimiento claro de cada cliente.",
    icon: MessageSquare,
  },
  {
    title: "Metricas en Vivo",
    description: "Visualiza tus pedidos y el rendimiento de tu negocio con información clara y actualizada.",
    icon: BarChart3,
  },
  {
    title: "Control Operativo",
    description: "Define horarios de atención y entrega para mantener informados a tus clientes en todo momento.",
    icon: Settings2,
  },
];

const steps = [
  {
    number: "01",
    title: "Carga tu inventario",
    icon: Globe,
  },
  {
    number: "02",
    title: "Recibe pedidos",
    icon: MessageSquare,
  },
  {
    number: "03",
    title: "Gestiona y crece",
    icon: BarChart3,
  },
];

const industries = [
  { label: "Abarroteras mayoristas", icon: Globe },
  { label: "Restaurantes", icon: MessageSquare },
  { label: "Ferreterías", icon: Settings2 },
  { label: "Distribuidoras", icon: Globe },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EEFAEE]">
      {/* Hero Section */}
      <section className="relative pt-6 pb-6 overflow-hidden px-2 sm:px-4 lg:px-6">
        <div className="max-w-[98%] mx-auto bg-[#74E79C] min-h-[85vh] lg:min-h-[92vh] flex items-center rounded-[4rem] shadow-2xl shadow-emerald-900/10 relative overflow-hidden">
          {/* Internal Navbar Content */}
          <div className="absolute top-8 left-8 right-12 z-20 flex items-center justify-between pointer-events-auto">
            <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/images/isologo-principal.webp"
                alt="MercaConnect"
                width={240}
                height={100}
                className="h-14 lg:h-16 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
          </div>
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          <div className="max-w-[98%] mx-auto px-8 sm:px-12 py-20 w-full relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.h1
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A3E35] leading-tight"
                >
                  Tu negocio,{" "}
                  <span className="text-white drop-shadow-sm">automatizado en un solo lugar</span>
                </motion.h1>
                <motion.p
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-6 text-lg sm:text-xl text-[#1A3E35]/80 leading-relaxed max-w-lg"
                >
                  MercaConnect conecta tu negocio con tus clientes a través de canales digitales como WhatsApp. Gestiona pedidos, catálogo y atención desde un solo panel.
                </motion.p>
                <motion.div
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-8 flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="bg-[#1A3E35] text-white hover:bg-[#245a4a] font-black text-base px-10 h-14 rounded-full shadow-xl shadow-emerald-900/20"
                    >
                      Iniciar Sesion
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#1A3E35]/20 text-[#1A3E35] hover:bg-[#1A3E35]/5 font-bold text-base px-10 h-14 bg-transparent rounded-full"
                    >
                      Conocer mas
                    </Button>
                  </a>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="hidden md:flex justify-center"
              >
                <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                  <Image
                    src="/icons/ic_3.webp"
                    alt="MercaConnect"
                    width={384}
                    height={384}
                    className="relative z-10 drop-shadow-[0_20px_50px_rgba(26,62,53,0.15)] object-contain w-full h-full"
                    unoptimized
                  />
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl border border-white/30" />
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-6 px-2 sm:px-4 lg:px-6">
        <div className="max-w-[98%] mx-auto bg-white rounded-[4rem] py-20 md:py-28 shadow-sm border border-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-[#1A3E35]"
              >
                Convierte mensajes en ventas
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
              >
                Automatiza la atención, organiza pedidos y gestiona tu negocio desde un solo lugar.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="group bg-white rounded-3xl p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-gray-100 hover:border-[#74E79C]/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#74E79C]/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />
                  <div className="w-14 h-14 bg-[#1A3E35] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#1A3E35]/20 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-[#74E79C]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A3E35] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="steps" className="py-6 px-2 sm:px-4 lg:px-6">
        <div className="max-w-[98%] mx-auto bg-[#EEFAEE] rounded-[4rem] py-20 md:py-28 shadow-sm border border-[#74E79C]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-[#1A3E35]"
              >
                Como funciona
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="mt-4 text-lg text-gray-600"
              >
                Tres pasos para automatizar tus ventas.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              {steps.map((step) => (
                <motion.div
                  key={step.number}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="group text-center"
                >
                  <div className="w-24 h-24 bg-[#1A3E35] rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative shadow-xl shadow-[#1A3E35]/10 group-hover:rotate-6 transition-transform">
                    <step.icon className="h-10 w-10 text-[#74E79C]" />
                    <span className="absolute -top-3 -right-3 w-10 h-10 bg-[#74E79C] text-[#1A3E35] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-[#74E79C]/30">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1A3E35] tracking-tight">
                    {step.title}
                  </h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Container including Industries and CTA */}
      <footer className="px-2 sm:px-4 lg:px-6 pb-6">
        <div className="max-w-[98%] mx-auto bg-[#0A1612] text-white py-20 px-8 sm:px-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
          {/* Subtle grid pattern overlay for footer */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          {/* Industries integrated into footer */}
          <div className="max-w-7xl mx-auto relative z-10 mb-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-white"
              >
                Para distribuidores y negocios con alto volumen de pedidos
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="mt-4 text-lg text-white/60"
              >
                Ideal para abarroteras mayoristas y distribuidores que reciben pedidos constantes por WhatsApp.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-4"
            >
              {industries.map((industry) => (
                <motion.div
                  key={industry.label}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 hover:bg-white/10 hover:border-[#74E79C]/30 transition-all"
                >
                  <industry.icon className="h-5 w-5 text-[#74E79C]" />
                  <span className="font-medium text-white/90">
                    {industry.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* CTA integrated into footer */}
          <div className="max-w-7xl mx-auto text-center relative z-10 mb-32 border-t border-white/5 pt-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
              >
                Automatiza tu negocio hoy
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="mt-6 text-lg text-white/80 max-w-xl mx-auto"
              >
                Empieza a recibir pedidos por WhatsApp y gestionalos desde un
                panel profesional.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="mt-10"
              >
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-[#1A3E35] text-white hover:bg-[#245a4a] font-black text-lg px-12 h-16 rounded-full shadow-2xl shadow-emerald-900/20"
                  >
                    Iniciar Sesion
                    <ChevronRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Original Footer Links and Info */}
          <div className="pt-20 border-t border-white/5 relative z-10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
              {/* Brand, Social and Partners Grouped */}
              <div className="flex flex-col md:flex-row items-start gap-12 md:gap-24">
                {/* Brand and Social */}
                <div className="flex flex-col items-start">
                  <Image
                    src="/images/isologo-principal.webp"
                    alt="MercaConnect"
                    width={200}
                    height={80}
                    className="h-14 w-auto object-contain mb-8 transition-transform hover:scale-105"
                    unoptimized
                  />
                  <div className="flex gap-4">
                    <a href="https://www.facebook.com/kolyn.io/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a href="https://www.instagram.com/kolyn.io" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                      <Instagram className="h-5 w-5" />
                    </a>
                  </div>
                </div>

                {/* Partners integrated next to brand */}
                <div className="flex flex-col items-start">
                  <h4 className="font-bold text-sm mb-6 uppercase tracking-wider text-white/90">Alianzas</h4>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 grayscale brightness-200 opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                      <Image src="/kolyn-logo.png" alt="Meta Tech Provider" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
                      <div className="text-[10px] leading-tight font-bold text-white">
                        META<br /><span className="font-normal opacity-70">Tech Provider</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-white/40">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
                <span>© 2026 MercaConnect. Todos los derechos reservados.</span>
                <span className="hidden md:inline opacity-20">|</span>
                <Link href="https://kolyn.io/legal" className="hover:text-white transition-colors">Términos y Condiciones</Link>
                <span className="hidden md:inline opacity-20">|</span>
                <Link href="https://kolyn.io/politicas-de-privacidad" className="hover:text-white transition-colors">Políticas de Privacidad</Link>
              </div>

              <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-[10px]">Powered by</span>
                <a href="https://kolyn.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <Image src="/kolyn-logo.png" alt="Kolyn" width={16} height={16} className="h-4 w-4" unoptimized />
                  <span className="font-bold tracking-tighter">KOLYN</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
