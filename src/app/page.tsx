"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  MapPin,
  Camera,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  MousePointerClick,
  MessageCircle,
  Plus,
  Users,
  Loader2,
} from "lucide-react";
import { translations, type Language } from "@/lib/translations";
import { serviceMeta, serviceBlurb } from "@/lib/service-meta";
import type { SalonData } from "@/lib/turso";
import BookingForm from "@/components/BookingForm";
import ServiceIcon from "@/components/ServiceIcon";
import { Instagram } from "@/components/icons";

const GALLERY = [
  { src: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&q=80", sq: "Nail art me detaje ari", en: "Nail art with gold detail" },
  { src: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&q=80", sq: "Manikyr gel minimalist", en: "Minimalist gel manicure" },
  { src: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&q=80", sq: "Pedikyr spa premium", en: "Premium spa pedicure" },
];

const WHY = [
  { icon: <Sparkles className="w-5 h-5" />, t: "why_1_title", d: "why_1_desc", tone: "bg-gold-100 text-gold-700" },
  { icon: <ShieldCheck className="w-5 h-5" />, t: "why_2_title", d: "why_2_desc", tone: "bg-emerald-50 text-emerald-700" },
  { icon: <Award className="w-5 h-5" />, t: "why_3_title", d: "why_3_desc", tone: "bg-sky-50 text-sky-700" },
  { icon: <Clock className="w-5 h-5" />, t: "why_4_title", d: "why_4_desc", tone: "bg-brand-100 text-brand-700" },
] as const;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("sq");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [pick, setPick] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [loadingSalon, setLoadingSalon] = useState(true);
  const bookingRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  useEffect(() => {
    let alive = true;
    fetch("/api/salon")
      .then((r) => r.json())
      .then((d: SalonData) => alive && setSalon(d))
      .catch(() => {})
      .finally(() => alive && setLoadingSalon(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      setPastHero(window.scrollY > window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goBooking = useCallback((serviceId?: string) => {
    if (serviceId) setPick(serviceId);
    setMenuOpen(false);
    requestAnimationFrame(() => bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const goSection = useCallback((id: string) => {
    setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const services = salon?.services ?? [];
  const workers = salon?.workers ?? [];
  const preferredServiceId = salon?.preferredServiceId ?? services[0]?.id ?? null;
  const cfg = salon?.config;
  const igHandle = cfg?.instagram ?? "spartaroyale";
  const igDm = `https://ig.me/m/${igHandle}`;
  const igProfile = `https://instagram.com/${igHandle}`;

  const nav = [
    { label: t.nav_services, id: "services" },
    { label: t.nav_gallery, id: "gallery" },
    { label: t.nav_about, id: "about" },
    { label: t.nav_contact, id: "contact" },
  ];

  const dayNames = lang === "sq"
    ? { 0: "E Diel", 1: "E Hënë", 2: "E Martë", 3: "E Mërkurë", 4: "E Enjte", 5: "E Premte", 6: "E Shtunë" }
    : { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };

  const steps = lang === "sq"
    ? [
        { icon: <MousePointerClick className="w-5 h-5" />, t: "Zgjidhni shërbimin", d: "Lista dhe çmimet vijnë direkt nga salloni, gjithmonë të përditësuara." },
        { icon: <CalendarCheck className="w-5 h-5" />, t: "Zgjidhni stafin dhe orën", d: "Shihni kush është i lirë dhe cilat orare janë realisht të disponueshme." },
        { icon: <MessageCircle className="w-5 h-5" />, t: "Termini është i konfirmuar", d: "Në momentin që rezervohet Termini, Konfirmohet Termini" },
      ]
    : [
        { icon: <MousePointerClick className="w-5 h-5" />, t: "Pick your service", d: "The menu and prices come straight from the salon, always current." },
        { icon: <CalendarCheck className="w-5 h-5" />, t: "Choose staff and time", d: "See who's free and which times are genuinely available." },
        { icon: <MessageCircle className="w-5 h-5" />, t: "The Appointmnet is confirmed.", d: "The moment the appointment is booked, the appointment is confirmed." },
      ];

  const faqs = lang === "sq"
    ? [
        { q: "Si funksionon rezervimi online?", a: "Zgjidhni shërbimin, stafin dhe orarin e lirë, pastaj shkruani emrin dhe telefonin tuaj. Takimi shkon direkt në sistemin e sallonit dhe klienti ruhet automatikisht." },
        { q: "A ruhet klienti në dashboard?", a: "Po. Nëse emri dhe telefoni nuk ekzistojnë te klientët, krijohet një klient i ri. I njëjti telefon lidhet edhe me takimin." },
        { q: "A mund të zgjedh me kë dua të bëj takimin?", a: "Po. Në hapin e dytë shfaqet stafi që punon atë ditë me orarin përkatës. Nëse zgjidhni «Kushdo i lirë», caktohet specialistja e parë e disponueshme." },
        { q: "Si ju kontaktojmë nëse kemi pyetje?", a: "Na shkruani në Instagram. Telefoni në formular përdoret për regjistrimin e klientit dhe takimit." },
        { q: "Çfarë produktesh përdorni?", a: "Vetëm marka profesionale të certifikuara, pa substanca të dëmshme. Mjetet sterilizohen pas çdo klienti." },
      ]
    : [
        { q: "How does online booking work?", a: "Pick a service, a specialist and a free time slot, then enter your name and phone. The appointment goes straight into the salon system and the client is saved automatically." },
        { q: "Is the client saved in the dashboard?", a: "Yes. If the name and phone do not exist in clients, a new client is created. The same phone is linked to the appointment." },
        { q: "Can I choose who does my nails?", a: "Yes. Step two shows the staff working that day with their hours. Pick “Anyone available” and the first free specialist is assigned." },
        { q: "How do we contact you with questions?", a: "Message us on Instagram. The phone field is used to register the client and appointment." },
        { q: "What products do you use?", a: "Only certified professional brands, free from harmful substances. Every tool is sterilised after each client." },
      ];

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-800">
      {/* ═══════════ HEADER morphs into a floating glass pill ═══════════ */}
      <header
        className={`fixed z-50 left-0 right-0 transition-[top] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
          scrolled ? "top-3" : "top-0"
        }`}
      >
        <nav
          className={`relative flex items-center justify-between gap-3 transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
            scrolled
              ? "h-14 px-3 sm:px-4 mx-auto max-w-[1080px] rounded-full border border-white/50 bg-white/65 shadow-[0_8px_32px_-8px_rgba(71,17,21,0.22),inset_0_1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-2xl backdrop-saturate-150"
              : "h-16 lg:h-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto rounded-none border border-transparent bg-transparent"
          }`}
        >
          {/* gold sheen that only shows in pill state */}
          <span
            className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-gold-200/25 via-transparent to-brand-200/20 transition-opacity duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="relative group flex items-center gap-2.5 shrink-0"
            aria-label="Sparta Royale"
          >
            <span
              className={`relative grid place-items-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                scrolled
                  ? "w-9 h-9 bg-gradient-to-br from-brand-800 to-brand-950 ring-1 ring-gold-300/40 shadow-inner"
                  : "w-10 h-10 lg:w-11 lg:h-11 bg-transparent ring-0"
              }`}
            >
              <Image
                src="/royale-logo.png"
                alt="Sparta Royale"
                width={44}
                height={44}
                priority
                className={`object-contain transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105 ${
                  scrolled ? "w-7 h-7" : "w-10 h-10 lg:w-11 lg:h-11 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                }`}
              />
            </span>
            <span className="leading-tight text-left">
              <span
                className={`block font-bold tracking-[0.08em] transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                  scrolled ? "text-[12px] text-brand-800" : "text-[13px] lg:text-[15px] text-white"
                }`}
              >
                SPARTA ROYALE
              </span>
              <span
                className={`block uppercase tracking-[0.22em] font-medium transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                  scrolled ? "text-[7px] text-gold-600" : "text-[8px] lg:text-[9px] text-gold-300/85"
                }`}
              >
                Nail &amp; Beauty Studio
              </span>
            </span>
          </button>

          {/* Links */}
          <ul className="relative hidden lg:flex items-center gap-0.5">
            {nav.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => goSection(l.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                    scrolled
                      ? "text-brand-900/65 hover:text-brand-800 hover:bg-brand-900/[0.06]"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="relative flex items-center gap-1.5 sm:gap-2">
            <a
              href={igDm}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram DM @${igHandle}`}
              className={`grid place-items-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] active:scale-95 ${
                scrolled
                  ? "w-9 h-9 text-brand-700 hover:text-white hover:bg-gradient-to-br hover:from-brand-600 hover:to-brand-800 border border-brand-900/10"
                  : "w-9 h-9 text-white/85 hover:text-white hover:bg-white/15 border border-white/20"
              }`}
            >
              <Instagram className="w-[17px] h-[17px]" />
            </a>

            <button
              onClick={() => setLang((l) => (l === "sq" ? "en" : "sq"))}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 h-9 rounded-full border transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] active:scale-95 ${
                scrolled
                  ? "border-brand-900/10 text-brand-900/55 hover:text-brand-800 hover:bg-brand-900/[0.06]"
                  : "border-white/20 text-white/75 hover:text-white hover:bg-white/10"
              }`}
            >
              {lang === "sq" ? "EN" : "SQ"}
            </button>

            <button
              onClick={() => goBooking()}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] active:scale-[0.97] ${
                scrolled
                  ? "h-9 px-4 text-[12px] bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-md shadow-brand-900/20 hover:shadow-lg"
                  : "h-10 px-5 text-[13px] bg-gradient-to-r from-gold-300 to-gold-400 text-brand-900 shadow-lg shadow-black/20 hover:from-gold-200 hover:to-gold-300"
              }`}
            >
              {t.nav_book}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`lg:hidden grid place-items-center w-9 h-9 rounded-full transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
                scrolled ? "text-brand-800 hover:bg-brand-900/[0.06]" : "text-white hover:bg-white/10"
              }`}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile sheet */}
        {menuOpen && (
          <div
            className={`lg:hidden animate-in overflow-hidden ${
              scrolled
                ? "mt-2 rounded-3xl border border-white/50 bg-white/85 backdrop-blur-2xl shadow-[0_16px_48px_-12px_rgba(71,17,21,0.3)]"
                : "bg-white/95 backdrop-blur-2xl border-t border-white/40 shadow-2xl"
            }`}
          >
            <div className="px-3 py-3 space-y-0.5">
              {nav.map((l) => (
                <button
                  key={l.id}
                  onClick={() => goSection(l.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-slate-700 font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {l.label}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => goBooking()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 text-white font-semibold shadow-md active:scale-[0.98] transition-transform"
                >
                  {t.nav_book}
                </button>
                <a
                  href={igDm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm"
                >
                  <Instagram className="w-4 h-4" />@{igHandle}
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section id="home" className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=80" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/25 to-brand-950/50" />
        </div>
        <div className="absolute top-1/4 right-[8%] w-72 h-72 rounded-full bg-gold-300/8 blur-[120px]" />
        <div className="absolute -bottom-20 left-[2%] w-96 h-96 rounded-full bg-brand-400/12 blur-[140px]" />

        <div className="relative z-10 w-full mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-300/12 border border-gold-300/25 text-gold-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-7 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              {t.hero_badge}
            </span>

            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.5rem] font-bold text-white tracking-tight mb-6">
              {t.hero_title_1}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-gold-200 via-gold-300 to-gold-500">
                {t.hero_title_2}
              </span>
              <br />
              {t.hero_title_3}
            </h1>

            <p className="text-white/65 text-base sm:text-lg max-w-lg mb-9 leading-relaxed font-light">
              {t.hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-14">
              <button
                onClick={() => goBooking()}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-gold-300 to-gold-400 text-brand-900 font-bold text-[15px] shadow-2xl shadow-gold-600/25 hover:shadow-gold-400/40 hover:from-gold-200 hover:to-gold-300 transition-all duration-300 active:scale-[0.97]"
              >
                {t.hero_cta_primary}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={igDm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/8 border border-white/15 text-white font-semibold text-[15px] backdrop-blur-md hover:bg-white/15 hover:border-white/30 transition-all active:scale-[0.97]"
              >
                <Instagram className="w-4 h-4" />@{igHandle}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {(lang === "sq"
                ? ["Shërbime nga sistemi", "Orar sipas stafit", "Konfirmim të shpejtë"]
                : ["Live service menu", "Staff-based schedule", "Fast confirmation"]
              ).map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/8 border border-white/12 text-white/70 text-[11px] font-semibold backdrop-blur-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold-300" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative -mt-px bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative -translate-y-10 lg:-translate-y-14 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {steps.map((s, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_-12px_rgba(71,17,21,0.18)] p-5 lg:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">{s.icon}</span>
                  <span className="text-[10px] font-bold text-slate-300 tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-[15px] mb-1.5">{s.t}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES from database ═══════════ */}
      <section id="services" className="scroll-mt-24 pt-4 pb-20 sm:pb-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead badge={t.services_badge} icon={<Sparkles className="w-3 h-3" />} title={t.services_title} sub={t.services_subtitle} />

          {loadingSalon ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 p-6 animate-pulse">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 mb-5" />
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-slate-50 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-50 rounded w-4/5 mb-6" />
                  <div className="h-6 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <Loader2 className="w-6 h-6 text-slate-300 mx-auto mb-3 animate-spin" />
              <p className="text-slate-400 text-sm">
                {lang === "sq" ? "Shërbimet po sinkronizohen..." : "Services are syncing..."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {services.map((s) => {
                const meta = serviceMeta(s.name);
                const preferred = s.id === preferredServiceId;
                return (
                  <button
                    key={s.id}
                    onClick={() => goBooking(s.id)}
                    className={`group relative text-left rounded-2xl p-5 lg:p-6 bg-gradient-to-br ${meta.card} border border-slate-100 hover:border-slate-200 shadow-[0_2px_12px_-6px_rgba(71,17,21,0.1)] hover:shadow-[0_16px_36px_-18px_rgba(71,17,21,0.28)] hover:-translate-y-1 transition-all duration-300`}
                  >
                    {preferred && (
                      <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded-full bg-gold-100 text-gold-700 border border-gold-200/70">
                        {lang === "sq" ? "Më i zgjedhur" : "Most booked"}
                      </span>
                    )}
                    <span className={`inline-flex w-11 h-11 rounded-xl items-center justify-center mb-5 bg-white shadow-sm ${meta.text}`}>
                      <ServiceIcon name={meta.icon} />
                    </span>
                    <h3 className="font-bold text-slate-800 text-[17px] mb-2 leading-snug">{s.name}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed mb-5 min-h-[2.6rem]">
                      {serviceBlurb(s.name, lang)}
                    </p>
                    <div className="flex items-end justify-between pt-4 border-t border-slate-900/5">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                          {lang === "sq" ? "Nga" : "From"}
                        </span>
                        <span className={`text-xl font-bold tabular-nums ${meta.text}`}>{s.price}€</span>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
                          <Clock className="w-3 h-3" />{s.duration} min
                        </span>
                        <span className="flex items-center justify-end gap-1 text-[12px] font-semibold text-brand-700 transition-all group-hover:gap-2">
                          {t.service_book_now}<ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ TEAM from database ═══════════ */}
      {workers.length > 0 && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-brand-50/40 to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-brand-100">
                <Users className="w-3 h-3" />
                {lang === "sq" ? "Ekipi" : "The Team"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 tracking-tight mb-3">
                {lang === "sq" ? "Zgjidhni specialisten tuaj" : "Choose your specialist"}
              </h2>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                {lang === "sq"
                  ? "Rezervoni me kë dëshironi. Oraret më poshtë vijnë direkt nga sistemi i sallonit."
                  : "Book with whoever you like. The hours below come straight from the salon system."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {workers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => goBooking()}
                  className="group flex items-center gap-3.5 pl-3 pr-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_-6px_rgba(71,17,21,0.12)] hover:shadow-[0_14px_32px_-16px_rgba(71,17,21,0.28)] hover:-translate-y-0.5 transition-all"
                >
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-gold-300 grid place-items-center font-bold text-base shrink-0 ring-1 ring-gold-300/20">
                    {w.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-left">
                    <span className="block font-bold text-slate-800 text-sm">{w.name}</span>
                    <span className="block text-[11px] text-slate-400 tabular-nums">
                      {w.days.length}/7 {lang === "sq" ? "ditë" : "days"} · {w.start}–{w.end}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ GALLERY ═══════════ */}
      <section id="gallery" className="scroll-mt-24 py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead badge={t.gallery_badge} icon={<Camera className="w-3 h-3" />} title={t.gallery_title} sub={t.gallery_subtitle} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <figure className="group relative col-span-2 lg:row-span-2 aspect-square lg:aspect-auto lg:min-h-[420px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600">
              <Image src={GALLERY[0].src} alt={GALLERY[0][lang]} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/75 via-brand-950/10 to-transparent" />
              <figcaption className="absolute bottom-5 left-5 right-5 text-white font-semibold text-sm">{GALLERY[0][lang]}</figcaption>
            </figure>

            {GALLERY.slice(1).map((g, i) => (
              <figure key={i} className="group relative aspect-square lg:aspect-auto lg:min-h-[202px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600">
                <Image src={g.src} alt={g[lang]} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <figcaption className="absolute bottom-4 left-4 right-4 text-white font-medium text-[13px]">{g[lang]}</figcaption>
              </figure>
            ))}

            <a
              href={igProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 group relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 p-6 flex flex-col items-center justify-center gap-2.5 min-h-[202px] transition-all hover:shadow-[0_16px_40px_-18px_rgba(71,17,21,0.5)]"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(232,208,160,0.12),transparent_60%)]" />
              <span className="relative w-12 h-12 rounded-full bg-white/10 border border-gold-300/25 grid place-items-center text-gold-300 group-hover:scale-105 transition-transform">
                <Instagram className="w-5 h-5" />
              </span>
              <span className="relative text-white font-semibold text-sm">
                {lang === "sq" ? "Shiko më shumë punë" : "See more of our work"}
              </span>
              <span className="relative text-gold-300/70 text-xs tracking-wide">@{igHandle}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY US ═══════════ */}
      <section id="about" className="scroll-mt-24 relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,208,160,0.07),transparent_55%)]" />
        <div className="absolute -top-32 right-0 w-[520px] h-[520px] rounded-full bg-gold-300/5 blur-[160px]" />
        <div className="absolute -bottom-32 -left-20 w-[420px] h-[420px] rounded-full bg-brand-500/20 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-300/12 border border-gold-300/20 text-gold-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              <Award className="w-3 h-3" />{t.why_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 tracking-tight leading-tight">{t.why_title}</h2>
            <p className="text-white/50 leading-relaxed text-[15px] sm:text-base">{t.why_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-16">
            {WHY.map((w, i) => (
              <div key={i} className="group rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.07] p-6 hover:bg-white/[0.08] hover:border-white/15 transition-all duration-300">
                <span className={`inline-flex w-11 h-11 rounded-xl items-center justify-center mb-5 ${w.tone} transition-transform duration-300 group-hover:scale-105`}>{w.icon}</span>
                <h3 className="font-bold text-white text-[15px] mb-2">{t[w.t]}</h3>
                <p className="text-white/45 text-[13px] leading-relaxed">{t[w.d]}</p>
              </div>
            ))}
          </div>        </div>
      </section>

      {/* ═══════════ BOOKING ═══════════ */}
      <section id="booking" ref={bookingRef} className="scroll-mt-20 py-20 sm:py-28 bg-gradient-to-b from-brand-50/50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-5 border border-brand-100">
                  <CalendarCheck className="w-3 h-3" />{t.booking_badge}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-800 mb-4 tracking-tight leading-[1.15]">{t.booking_title}</h2>
                <p className="text-slate-500 leading-relaxed mb-8 text-[15px]">{t.booking_subtitle}</p>

                <ul className="space-y-2.5 mb-7">
                  {(lang === "sq"
                    ? ["Konfirmim të shpejtë", "Zgjidhni vetë specialisten", "Oraret e lira në kohë reale", "Pa pagesë paraprake"]
                    : ["Fast confirmation", "Choose your own specialist", "Live availability, no guessing", "No upfront payment"]
                  ).map((p, i) => (
                    <li key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white border border-slate-100 shadow-[0_2px_10px_-6px_rgba(71,17,21,0.12)]">
                      <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                      <span className="text-slate-600 text-[13px] font-medium">{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white relative overflow-hidden">
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(232,208,160,0.14),transparent_60%)]" />
                  <p className="relative text-gold-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                    {lang === "sq" ? "Preferoni të shkruani?" : "Prefer to message?"}
                  </p>
                  <p className="relative text-white/60 text-[13px] leading-relaxed mb-4">
                    {lang === "sq" ? "Na shkruani në DM. Përgjigjemi gjatë orarit të punës." : "Send us a DM. We reply during opening hours."}
                  </p>
                  <a
                    href={igDm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-[13px] hover:bg-white/20 transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />@{igHandle}
                  </a>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <div className="rounded-2xl lg:rounded-3xl bg-white border border-slate-100 shadow-[0_24px_60px_-30px_rgba(71,17,21,0.25)] p-5 sm:p-8 lg:p-10">
                <BookingForm lang={lang} salon={salon} loading={loadingSalon} preselect={pick} onConsumed={() => setPick("")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 tracking-tight mb-3">
              {lang === "sq" ? "Pyetje të shpeshta" : "Frequently asked questions"}
            </h2>
            <p className="text-slate-400 text-sm">
              {lang === "sq" ? "Nuk e gjetët përgjigjen? " : "Didn't find your answer? "}
              <a href={igDm} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-semibold hover:text-brand-700 underline underline-offset-2 decoration-brand-200">
                {lang === "sq" ? "Na shkruani në Instagram" : "Message us on Instagram"}
              </a>
            </p>
          </div>

          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-start justify-between gap-4 py-5 text-left group">
                    <span className={`font-semibold text-[15px] transition-colors ${open ? "text-brand-800" : "text-slate-700 group-hover:text-brand-700"}`}>{f.q}</span>
                    <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border grid place-items-center transition-all duration-300 ${open ? "rotate-45 border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-400 group-hover:border-brand-300"}`}>
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden"><p className="text-slate-500 text-[14px] leading-relaxed pr-10">{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT hours from database ═══════════ */}
      <section id="contact" className="scroll-mt-24 py-16 sm:py-20 bg-brand-50/40 border-t border-brand-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_2px_12px_-6px_rgba(71,17,21,0.1)]">
              <span className="inline-flex w-10 h-10 rounded-xl bg-brand-50 text-brand-700 items-center justify-center mb-4"><MapPin className="w-5 h-5" /></span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2.5 text-brand-400">{t.contact_address}</p>
              <p className="font-semibold text-slate-800 text-sm">{cfg?.address ?? "Rr. Kacaniku, Nr. 17"}</p>
              <p className="text-slate-400 text-xs mt-1">{cfg?.city ?? "Prishtinë, Kosovë"}</p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-[0_2px_12px_-6px_rgba(71,17,21,0.1)]">
              <span className="inline-flex w-10 h-10 rounded-xl bg-gold-100 text-gold-700 items-center justify-center mb-4"><Clock className="w-5 h-5" /></span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 text-gold-600">{t.contact_hours_title}</p>
              <ul className="space-y-1.5">
                {DAY_ORDER.map((d) => {
                  const h = cfg?.hours?.[String(d)];
                  return (
                    <li key={d} className="flex justify-between text-[13px]">
                      <span className="text-slate-500">{dayNames[d as keyof typeof dayNames]}</span>
                      {h ? (
                        <span className="font-semibold text-slate-800 tabular-nums">{h.open} – {h.close}</span>
                      ) : (
                        <span className="font-medium text-slate-300">{t.contact_closed}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <a
              href={igDm}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-6 border border-brand-900 shadow-[0_2px_12px_-6px_rgba(71,17,21,0.2)] hover:shadow-[0_16px_40px_-18px_rgba(71,17,21,0.5)] transition-all relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(232,208,160,0.14),transparent_60%)]" />
              <span className="relative inline-flex w-10 h-10 rounded-xl bg-white/10 border border-gold-300/25 text-gold-300 items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Instagram className="w-5 h-5" />
              </span>
              <p className="relative text-[10px] uppercase tracking-[0.2em] font-bold mb-2.5 text-gold-400">Instagram</p>
              <p className="relative font-bold text-white text-lg">@{igHandle}</p>
              <p className="relative text-white/45 text-xs mt-1.5 leading-relaxed">
                {lang === "sq" ? "Shkruani në DM për rezervime dhe pyetje" : "DM us for bookings and questions"}
              </p>
              <span className="relative mt-4 inline-flex items-center gap-1.5 text-gold-300 text-[12px] font-semibold group-hover:gap-2.5 transition-all">
                {lang === "sq" ? "Hap bisedën" : "Open chat"}<ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-brand-950 text-white z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-800 to-brand-950 ring-1 ring-gold-300/25 grid place-items-center shrink-0">
                <Image src="/royale-logo.png" alt="Sparta Royale" width={36} height={36} className="w-7 h-7 object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block font-bold text-white tracking-[0.08em] text-[13px]">SPARTA ROYALE</span>
                <span className="block text-gold-400/80 text-[8px] uppercase tracking-[0.22em]">Nail &amp; Beauty Studio</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-white/40">
              {nav.map((l) => (
                <button key={l.id} onClick={() => goSection(l.id)} className="hover:text-gold-300 transition-colors">
                  {l.label}
                </button>
              ))}
              <button onClick={() => goBooking()} className="text-gold-300 font-semibold hover:text-gold-200 transition-colors">
                {t.nav_book}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-white/20">
            <span>&copy; {new Date().getFullYear()} Sparta Royale</span>
            <span>{cfg?.address ?? "Rr. Kacaniku, Nr. 17"} · {cfg?.city ?? "Prishtinë, Kosovë"}</span>
          </div>
        </div>
      </footer>

      {/* ═══════════ STICKY MOBILE BAR ═══════════ */}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${pastHero && !menuOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
        <div className="m-3 rounded-2xl border border-white/50 bg-white/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_40px_-10px_rgba(71,17,21,0.35)] px-3 py-2.5 mb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-2.5">
          <a
            href={igDm}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 shrink-0 rounded-xl border border-brand-900/10 text-brand-700 grid place-items-center active:scale-95 transition-transform"
            aria-label={`Instagram @${igHandle}`}
          >
            <Instagram className="w-[18px] h-[18px]" />
          </a>
          <button
            onClick={() => goBooking()}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-900/20 active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />{t.nav_book}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ badge, icon, title, sub }: { badge: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-5 border border-brand-100">
        {icon}{badge}
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-brand-800 mb-4 tracking-tight leading-tight">{title}</h2>
      <p className="text-slate-500 leading-relaxed text-[15px] sm:text-base">{sub}</p>
    </div>
  );
}
