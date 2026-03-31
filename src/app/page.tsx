"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  LayoutDashboard,
  KanbanSquare,
  FileText,
  ShoppingCart,
  UtensilsCrossed,
  Truck,
  Store,
  ChevronRight,
  Smartphone,
  Bot,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const features = [
  {
    icon: Smartphone,
    title: "Ventas por WhatsApp",
    description:
      "Tus clientes piden desde WhatsApp. El bot guia el pedido completo sin intervencion humana.",
  },
  {
    icon: LayoutDashboard,
    title: "Panel de Control",
    description:
      "Gestiona pedidos, productos, clientes y conversaciones desde un dashboard profesional.",
  },
  {
    icon: KanbanSquare,
    title: "Kanban de Pedidos",
    description:
      "Visualiza y gestiona el estado de cada pedido. Notifica a tus clientes automaticamente.",
  },
  {
    icon: FileText,
    title: "Templates de WhatsApp",
    description:
      "Envia mensajes profesionales aprobados por Meta a tus clientes.",
  },
];

const steps = [
  {
    icon: MessageCircle,
    number: "1",
    title: "El cliente escribe a tu WhatsApp",
  },
  {
    icon: Bot,
    number: "2",
    title: "El bot toma el pedido automaticamente",
  },
  {
    icon: Monitor,
    number: "3",
    title: "Tu gestionas desde el panel",
  },
];

const industries = [
  { icon: ShoppingCart, label: "Abarrotes" },
  { icon: UtensilsCrossed, label: "Restaurantes" },
  { icon: Truck, label: "Distribuidoras" },
  { icon: Store, label: "Tiendas en general" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EEFAEE]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A3E35]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/isologo-blanco.png"
              alt="MercaConnect"
              width={200}
              height={100}
              className="h-8 w-auto object-contain"
              priority
              unoptimized
            />
          </div>
          <Link href="/login">
            <Button className="bg-[#74E79C] text-[#1A3E35] hover:bg-[#5fd685] font-semibold">
              Iniciar Sesion
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div className="bg-gradient-to-br from-[#1A3E35] via-[#1A3E35] to-[#245a4a] min-h-[85vh] flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.h1
                  variants={fadeInUp}
                  transition={{ duration: 0.6 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
                >
                  Tu negocio en WhatsApp,{" "}
                  <span className="text-[#74E79C]">automatizado</span>
                </motion.h1>
                <motion.p
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-lg"
                >
                  MercaConnect conecta tu negocio con tus clientes a traves de
                  WhatsApp. Pedidos, catalogo y atencion — todo desde un solo
                  panel.
                </motion.p>
                <motion.div
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-8 flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="bg-[#74E79C] text-[#1A3E35] hover:bg-[#5fd685] font-semibold text-base px-8 h-12"
                    >
                      Iniciar Sesion
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 h-12 bg-transparent"
                    >
                      Conocer mas
                    </Button>
                  </a>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden md:flex justify-center"
              >
                <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                  <div className="absolute inset-0 bg-[#74E79C]/10 rounded-full blur-3xl" />
                  <Image
                    src="/merca-connect-logo.png"
                    alt="MercaConnect"
                    width={384}
                    height={384}
                    className="relative z-10 drop-shadow-2xl object-contain w-full h-full"
                    unoptimized
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-white">
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
              Todo lo que necesitas para vender por WhatsApp
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Herramientas profesionales para automatizar y gestionar tu negocio.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="bg-[#EEFAEE] rounded-2xl p-6 hover:shadow-lg transition-shadow border border-[#74E79C]/20"
              >
                <div className="w-12 h-12 bg-[#1A3E35] rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-[#74E79C]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A3E35] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-28 bg-[#EEFAEE]">
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
                className="text-center"
              >
                <div className="w-20 h-20 bg-[#1A3E35] rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                  <step.icon className="h-8 w-8 text-[#74E79C]" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#74E79C] text-[#1A3E35] rounded-full flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A3E35]">
                  {step.title}
                </h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="text-3xl sm:text-4xl font-bold text-[#1A3E35]"
            >
              Para todo tipo de negocio
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-4 text-lg text-gray-600"
            >
              Para abarrotes, restaurantes, distribuidoras y mas.
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
                className="flex items-center gap-3 bg-[#EEFAEE] border border-[#74E79C]/20 rounded-full px-6 py-3 hover:shadow-md transition-shadow"
              >
                <industry.icon className="h-5 w-5 text-[#1A3E35]" />
                <span className="font-medium text-[#1A3E35]">
                  {industry.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#1A3E35] to-[#245a4a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-white"
            >
              Automatiza tu negocio hoy
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-4 text-lg text-white/80 max-w-xl mx-auto"
            >
              Empieza a recibir pedidos por WhatsApp y gestionalos desde un
              panel profesional.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mt-8"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-[#74E79C] text-[#1A3E35] hover:bg-[#5fd685] font-semibold text-base px-10 h-12"
                >
                  Iniciar Sesion
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A3E35] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Image
                src="/isologo-blanco.png"
                alt="MercaConnect"
                width={160}
                height={80}
                className="h-6 w-auto object-contain opacity-60"
                unoptimized
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">Powered by</span>
              <a
                href="https://kolyn.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/kolyn-logo.png"
                  alt="Kolyn"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                  unoptimized
                />
                <span className="text-white/60 text-sm font-medium">Kolyn</span>
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/login"
                className="text-white/60 hover:text-white transition-colors"
              >
                Iniciar Sesion
              </Link>
              <a
                href="mailto:contacto@kolyn.dev"
                className="text-white/60 hover:text-white transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
