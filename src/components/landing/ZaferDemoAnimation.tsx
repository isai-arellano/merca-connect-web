"use client";

import React, { useEffect, useRef, useState } from "react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const B = {
  dark: "#132d28",
  accent: "#6de8a0",
  accentD: "#3dc47a",
  waBg: "#111b21",
  waPane: "#1f2c34",
  waOut: "#005c4b",
  waIn: "#202c33",
  waText: "#e9edef",
  waGray: "#8696a0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const easeOutCubic = (t: number) => (--t) * t * t + 1;

const useFade = (t: number, start: number, dur = 0.4) =>
  t < start ? 0 : easeOutCubic(clamp((t - start) / dur, 0, 1));

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Pendiente: "#f59e0b",
  Confirmado: "#3b82f6",
  "En Preparación": "#8b5cf6",
  "En Camino": "#06b6d4",
  Listo: "#22c55e",
  Entregado: "#6b7280",
  "En Proceso": "#8b5cf6",
  Activo: "#22c55e",
  "Listo para Recoger": "#22c55e",
  "Listo para Entrega": "#22c55e",
  Agendado: "#3b82f6",
  Completado: "#22c55e",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface MsgDef {
  text: string;
  from: "client" | "zafer";
  ts: string;
  at: number;
  link?: boolean;
}

interface OrderDef {
  id: string;
  client: string;
  amount: string;
  items: string;
  note: string;
}

interface StatusStep {
  at: number;
  o1: string;
  o2: string;
}

interface Industry {
  label: string;
  color: string;
  link: string;
  name1: string;
  name2: string;
  orders: OrderDef[];
  chat1: MsgDef[];
  chat2: MsgDef[];
  statusProgression: StatusStep[];
}

// ─── Industry definitions ─────────────────────────────────────────────────────
const CYCLE = 34;

const INDUSTRIES: Industry[] = [
  // ── 1. Comida ──────────────────────────────────────────────────────────────
  {
    label: "Comida y Restaurantes",
    color: "#ef4444",
    link: "merca-connect.com/menu",
    name1: "Tacos El Güero",
    name2: "Pizzería Don Gino",
    orders: [
      {
        id: "#MC-141",
        client: "Tacos El Güero",
        amount: "$180 MXN",
        items: "2 ord. Pastor + 1 ord. Campechanos",
        note: "Recoger en local · a nombre de Marco",
      },
      {
        id: "#MC-142",
        client: "Pizzería Don Gino",
        amount: "$240 MXN",
        items: "1 pizza grande de pepperoni",
        note: "Domicilio: Calle Morelos 45, Col. Centro",
      },
    ],
    chat1: [
      { text: "Hola, ¿qué tacos tienen?", from: "client", ts: "12:34", at: 0.2 },
      { text: "De pastor, bistec, longaniza y campechanos.\nOrden de 5 tacos $60.", from: "zafer", ts: "12:34", at: 1.8 },
      { text: "Pasame el menú por favor", from: "client", ts: "12:35", at: 4.0 },
      { text: "Aquí lo tienes", from: "zafer", ts: "12:35", at: 5.5, link: true },
      { text: "2 de pastor y 1 de campechanos", from: "client", ts: "12:36", at: 8.5 },
      { text: "Total $180. ¿Nombre para el pedido?", from: "zafer", ts: "12:36", at: 10.0 },
      { text: "Marco", from: "client", ts: "12:36", at: 12.0 },
      { text: "Pedido #MC-141 a nombre de Marco. Listo en 10 min.", from: "zafer", ts: "12:37", at: 13.5 },
      { text: "Tu pedido esta En Preparacion. Ya casi esta, Marco.", from: "zafer", ts: "12:42", at: 23.0 },
      { text: "Listo Marco. Ya puedes pasar por tus tacos.", from: "zafer", ts: "12:47", at: 29.5 },
    ],
    chat2: [
      { text: "Buenas, ¿cuánto la pizza grande?", from: "client", ts: "12:35", at: 0.8 },
      { text: "Grande $240, mediana $180, personal $120.", from: "zafer", ts: "12:35", at: 2.5 },
      { text: "1 grande de pepperoni a domicilio", from: "client", ts: "12:36", at: 5.5 },
      { text: "Con gusto. ¿Cuál es tu dirección de entrega?", from: "zafer", ts: "12:36", at: 7.0 },
      { text: "Calle Morelos 45, Col. Centro", from: "client", ts: "12:37", at: 10.5 },
      { text: "Pedido #MC-142 confirmado. Entrega en 30 min.", from: "zafer", ts: "12:37", at: 12.0 },
      { text: "Tu pedido va En Camino. ETA 20 min.", from: "zafer", ts: "12:44", at: 24.5 },
      { text: "Pedido entregado. Buen provecho.", from: "zafer", ts: "12:58", at: 30.5 },
    ],
    statusProgression: [
      { at: 14, o1: "Pendiente", o2: "Confirmado" },
      { at: 22, o1: "En Preparación", o2: "En Camino" },
      { at: 29, o1: "Listo para Recoger", o2: "Entregado" },
    ],
  },

  // ── 2. Abarrotera ──────────────────────────────────────────────────────────
  {
    label: "Abarrotera Distribuidora",
    color: "#f59e0b",
    link: "merca-connect.com/catalogo/abarrotes",
    name1: "Tienda Norte",
    name2: "Mini-súper Sur",
    orders: [
      {
        id: "#MC-205",
        client: "Tienda Norte",
        amount: "$5,900 MXN",
        items: "10× Arroz 25kg · 5× Frijol 25kg",
        note: "Entrega: Blvd. Industrial 234 · mañana 8am",
      },
      {
        id: "#MC-206",
        client: "Mini-súper Sur",
        amount: "$2,560 MXN",
        items: "8× Aceite 20L bidón",
        note: "Contra entrega · Av. Hidalgo 88",
      },
    ],
    chat1: [
      { text: "Buenos días, ¿manejan arroz a granel?", from: "client", ts: "9:02", at: 0.2 },
      { text: "Sí, distribuidores mayoristas.\nArroz 25kg $380, mínimo 5 piezas.", from: "zafer", ts: "9:02", at: 2.0 },
      { text: "¿Tienen frijol también?", from: "client", ts: "9:03", at: 4.2 },
      { text: "Frijol negro 25kg $420. Ver catálogo:", from: "zafer", ts: "9:03", at: 5.8, link: true },
      { text: "Quiero 10 de arroz y 5 de frijol", from: "client", ts: "9:04", at: 9.0 },
      { text: "Total $5,900. ¿Entrega a domicilio o recoges en bodega?", from: "zafer", ts: "9:04", at: 10.5 },
      { text: "A domicilio por favor", from: "client", ts: "9:05", at: 12.0 },
      { text: "¿Cuál es la dirección de entrega?", from: "zafer", ts: "9:05", at: 13.5 },
      { text: "Blvd. Industrial 234, Nave 5", from: "client", ts: "9:05", at: 15.5 },
      { text: "Pedido #MC-205 confirmado. Entrega mañana 8am.", from: "zafer", ts: "9:06", at: 17.0 },
      { text: "Tu pedido va En Camino. ETA: 30 min, Tienda Norte.", from: "zafer", ts: "9:40", at: 24.5 },
      { text: "Pedido entregado en bodega. Hasta la próxima.", from: "zafer", ts: "9:46", at: 30.5 },
    ],
    chat2: [
      { text: "¿Cuál es el precio del aceite al mayoreo?", from: "client", ts: "9:03", at: 1.0 },
      { text: "Aceite 20L bidón $320, mínimo 6 piezas.", from: "zafer", ts: "9:03", at: 2.8 },
      { text: "Mándame el catálogo completo", from: "client", ts: "9:04", at: 6.5 },
      { text: "Aquí tienes precios y variedades:", from: "zafer", ts: "9:04", at: 8.0, link: true },
      { text: "Quiero 8 bidones", from: "client", ts: "9:05", at: 11.5 },
      { text: "Total $2,560. ¿Contra entrega o transferencia?", from: "zafer", ts: "9:05", at: 13.0 },
      { text: "Contra entrega. ¿Entregan en mi local?", from: "client", ts: "9:06", at: 15.0 },
      { text: "Sí. ¿Cuál es la dirección?", from: "zafer", ts: "9:06", at: 16.5 },
      { text: "Av. Hidalgo 88, Col. Obrera", from: "client", ts: "9:07", at: 19.0 },
      { text: "Pedido #MC-206 confirmado. Entrega miércoles.", from: "zafer", ts: "9:07", at: 20.5 },
      { text: "Tu pedido En Camino. Llegamos en 40 min, Mini-súper Sur.", from: "zafer", ts: "9:52", at: 25.5 },
      { text: "Entregado. Buenas ventas.", from: "zafer", ts: "9:58", at: 31.0 },
    ],
    statusProgression: [
      { at: 17, o1: "Confirmado", o2: "Pendiente" },
      { at: 22, o1: "En Camino", o2: "Confirmado" },
      { at: 29, o1: "Entregado", o2: "En Camino" },
    ],
  },

  // ── 3. Servicios ───────────────────────────────────────────────────────────
  {
    label: "Servicios a Domicilio",
    color: "#8b5cf6",
    link: "merca-connect.com/servicios",
    name1: "Carlos M.",
    name2: "Sra. López",
    orders: [
      {
        id: "#SVC-021",
        client: "Carlos M.",
        amount: "$350 MXN",
        items: "Revisión y diagnóstico A/C",
        note: "Hoy 4pm · Calle Hidalgo 122, Col. Del Valle",
      },
      {
        id: "#SVC-022",
        client: "Sra. López",
        amount: "$450 MXN",
        items: "Limpieza hogar aprox. 80m²",
        note: "Mañana 10am · Av. Constitución 88",
      },
    ],
    chat1: [
      { text: "Hola, necesito revisar mi clima", from: "client", ts: "11:15", at: 0.2 },
      { text: "Claro. Revisión y diagnóstico $350.\n¿Cuándo lo necesitas?", from: "zafer", ts: "11:15", at: 1.8 },
      { text: "¿Tienen disponibilidad hoy?", from: "client", ts: "11:16", at: 4.0 },
      { text: "Sí, técnico disponible esta tarde. Ver servicios:", from: "zafer", ts: "11:16", at: 5.5, link: true },
      { text: "Lo necesito hoy a las 4pm", from: "client", ts: "11:17", at: 8.5 },
      { text: "¿Cuál es tu dirección?", from: "zafer", ts: "11:17", at: 10.0 },
      { text: "Calle Hidalgo 122, Col. Del Valle", from: "client", ts: "11:17", at: 12.0 },
      { text: "Servicio #SVC-021 agendado. Técnico llega a las 4pm.", from: "zafer", ts: "11:18", at: 13.5 },
      { text: "Tu técnico está En Camino. Llega en 15 min, Carlos.", from: "zafer", ts: "3:45pm", at: 23.0 },
      { text: "Servicio completado. Gracias por tu preferencia.", from: "zafer", ts: "5:10pm", at: 29.5 },
    ],
    chat2: [
      { text: "Buenas, ¿cuánto cobran limpieza de casa?", from: "client", ts: "11:16", at: 0.8 },
      { text: "Casa hasta 100m² $450, material incluido.", from: "zafer", ts: "11:16", at: 2.5 },
      { text: "¿Tienen para mañana?", from: "client", ts: "11:17", at: 5.5 },
      { text: "Sí, disponibles desde las 9am. Ver paquetes:", from: "zafer", ts: "11:17", at: 7.0, link: true },
      { text: "Mañana a las 10am", from: "client", ts: "11:18", at: 10.5 },
      { text: "¿Dirección y metros cuadrados aproximados?", from: "zafer", ts: "11:18", at: 12.0 },
      { text: "Av. Constitución 88, aprox 80m²", from: "client", ts: "11:19", at: 15.0 },
      { text: "Servicio #SVC-022 agendado. Mañana 10am confirmado.", from: "zafer", ts: "11:19", at: 16.5 },
      { text: "Tu equipo está En Camino. Llegan en 20 min, Sra. López.", from: "zafer", ts: "9:40am", at: 24.5 },
      { text: "Servicio completado. Esperamos tu calificación.", from: "zafer", ts: "12:15pm", at: 30.5 },
    ],
    statusProgression: [
      { at: 14, o1: "Agendado", o2: "Pendiente" },
      { at: 17, o1: "Agendado", o2: "Agendado" },
      { at: 22, o1: "En Camino", o2: "En Camino" },
      { at: 29, o1: "Completado", o2: "Completado" },
    ],
  },
];

const TOTAL_DURATION = CYCLE * 3;

// ─── TypingDots ───────────────────────────────────────────────────────────────
function TypingDots({ lt }: { lt: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "9px 13px",
        background: B.waIn,
        borderRadius: "8px 14px 14px 2px",
        minWidth: 50,
      }}
    >
      {[0, 0.33, 0.66].map((off, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: B.waGray,
            transform: `translateY(${Math.sin(((lt * 3 + off) % 1) * Math.PI * 2) * 3}px)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg, link }: { msg: MsgDef; link: string }) {
  const isZ = msg.from === "zafer";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isZ ? "flex-end" : "flex-start",
        marginBottom: 3,
        alignItems: "flex-end",
        gap: 4,
      }}
    >
      {!isZ && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#4a8e7b,#2d6b58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          C
        </div>
      )}
      <div
        style={{
          maxWidth: "80%",
          padding: "8px 11px",
          fontSize: 11.5,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          color: B.waText,
          background: isZ ? B.waOut : B.waIn,
          borderRadius: isZ ? "13px 3px 13px 13px" : "3px 13px 13px 13px",
          wordBreak: "break-word",
        }}
      >
        {msg.text}
        {msg.link && (
          <div
            style={{
              marginTop: 6,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 7,
              padding: "6px 9px",
              borderLeft: `3px solid ${B.accent}`,
            }}
          >
            <div style={{ fontSize: 9, color: B.waGray, marginBottom: 1 }}>
              merca-connect.com
            </div>
            <div style={{ fontSize: 11, color: B.accent, fontWeight: 600 }}>
              {link}
            </div>
            <div style={{ fontSize: 9, color: B.waGray, marginTop: 1 }}>
              Ver completo →
            </div>
          </div>
        )}
        <div
          style={{
            textAlign: "right",
            fontSize: 9,
            color: B.waGray,
            marginTop: 2,
          }}
        >
          {msg.ts}
          {isZ ? " ✓✓" : ""}
        </div>
      </div>
      {isZ && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${B.accent},${B.accentD})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: B.dark,
            flexShrink: 0,
          }}
        >
          Z
        </div>
      )}
    </div>
  );
}

// ─── Phone ────────────────────────────────────────────────────────────────────
function Phone({
  title,
  messages,
  typing,
  link,
  lt,
}: {
  title: string;
  messages: MsgDef[];
  typing: boolean;
  link: string;
  lt: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (ref.current && messages.length !== prevLen.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
      prevLen.current = messages.length;
    }
  }, [messages.length]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 20,
        overflow: "hidden",
        background: B.waBg,
        display: "flex",
        flexDirection: "column",
        border: "1.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: B.waPane,
          padding: "7px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 33,
            height: 33,
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg,#3a7a6b,#1d5248)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {title[0]}
        </div>
        <div>
          <div style={{ color: B.waText, fontSize: 12.5, fontWeight: 600 }}>
            {title}
          </div>
          <div style={{ color: B.accent, fontSize: 9.5 }}>● en línea</div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={ref}
        className="zdemo-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "9px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          scrollBehavior: "smooth",
          minHeight: 0,
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} link={link} />
        ))}
        {typing && (
          <div style={{ display: "flex", paddingLeft: 28 }}>
            <TypingDots lt={lt} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          background: B.waPane,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: B.waBg,
            borderRadius: 18,
            padding: "5px 10px",
            color: B.waGray,
            fontSize: 10.5,
          }}
        >
          Mensaje
        </div>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: B.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={B.dark}>
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({
  order,
  status,
  isNew,
}: {
  order: OrderDef;
  status: string;
  isNew: boolean;
}) {
  const color = STATUS_COLORS[status] || "#f59e0b";
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 9,
        padding: "10px 12px",
        border: "1px solid #eee",
        animation: isNew ? "zdPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1)" : "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}
      >
        <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 11.5 }}>
          {order.id}
        </span>
        <span style={{ color: "#bbb", fontSize: 9.5 }}>ahora</span>
      </div>
      <div style={{ color: "#333", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
        {order.client}
      </div>
      <div style={{ color: "#777", fontSize: 10, marginBottom: 3 }}>
        {order.items}
      </div>
      <div style={{ color: B.dark, fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
        {order.amount}
      </div>
      {order.note && (
        <div style={{ color: "#aaa", fontSize: 9.5, marginBottom: 5, lineHeight: 1.35 }}>
          {order.note}
        </div>
      )}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 20,
          background: color + "1a",
          border: `1px solid ${color}44`,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
          }}
        />
        <span style={{ color, fontWeight: 700, fontSize: 10 }}>{status}</span>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({
  orders,
  statuses,
  newFlags,
  accentColor,
  lt,
}: {
  orders: OrderDef[];
  statuses: [string, string];
  newFlags: [boolean, boolean];
  accentColor: string;
  lt: number;
}) {
  const visibleCount = (lt >= 16.5 ? 1 : 0) + (lt >= 18.5 ? 1 : 0);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f7f8fa",
        borderRadius: 13,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "9px 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            background: B.dark,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke={B.accent}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 12.5, color: "#1a1a2e" }}>
          Pedidos
        </span>
        <div
          style={{
            background: accentColor + "22",
            color: accentColor,
            borderRadius: 20,
            padding: "2px 8px",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          {visibleCount}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#25d366",
              animation: "zdPulse 1.5s infinite",
            }}
          />
        </div>
      </div>

      {/* Sub-header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "5px 12px",
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: accentColor,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 11.5, color: "#374151" }}>
          Activos
        </span>
        <span style={{ fontSize: 10.5, color: "#9ca3af", marginLeft: "auto" }}>
          {visibleCount}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1,
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {lt >= 16.5 && (
          <OrderCard
            order={orders[0]}
            status={statuses[0]}
            isNew={lt >= 16.5 && lt < 17.2}
          />
        )}
        {lt >= 18.5 && (
          <OrderCard
            order={orders[1]}
            status={statuses[1]}
            isNew={lt >= 18.5 && lt < 19.2}
          />
        )}
        {visibleCount === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d1d5db",
              fontSize: 11.5,
            }}
          >
            Esperando pedidos…
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Industry Badge ───────────────────────────────────────────────────────────
function IndustryBadge({
  label,
  color,
  opacity,
}: {
  label: string;
  color: string;
  opacity: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        zIndex: 10,
        transition: "opacity 0.5s",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          borderRadius: 24,
          padding: "7px 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 3px ${color}44`,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>
          merca-connect.com
        </span>
      </div>
    </div>
  );
}

// Canvas dimensions — fixed logical size, scaled to fit container
const CANVAS_W = 900;
const CANVAS_H = 520;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ZaferDemoAnimation() {
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(1);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animation loop
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      timeRef.current = (timeRef.current + dt) % TOTAL_DURATION;
      setTime(timeRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scale canvas to fit wrapper width
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const s = el.clientWidth / CANVAS_W;
      setScale(Math.max(0.1, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cycleIdx = Math.floor(time / CYCLE) % 3;
  const lt = time % CYCLE;

  const ind = INDUSTRIES[cycleIdx];
  const { chat1, chat2, orders: orderDefs, statusProgression, link, color: iColor } = ind;

  const msgs1 = chat1.filter((m) => m.at <= lt);
  const msgs2 = chat2.filter((m) => m.at <= lt);

  const typing1 = chat1
    .filter((m) => m.from === "zafer")
    .some((m) => lt >= m.at - 1.5 && lt < m.at);
  const typing2 = chat2
    .filter((m) => m.from === "zafer")
    .some((m) => lt >= m.at - 1.5 && lt < m.at);

  const getStatus = (which: 0 | 1): string => {
    let s = "Pendiente";
    for (const step of statusProgression) {
      if (lt >= step.at) s = which === 0 ? step.o1 : step.o2;
    }
    return s;
  };

  const showPanel = lt >= 16;

  const c1Opacity = lt < 0.8 ? lt / 0.8 : 1;
  const c1TX = lt < 0.8 ? (1 - lt / 0.8) * -40 : 0;
  const c2Opacity = lt < 1.0 ? lt / 1.0 : 1;
  const c2TX = lt < 1.0 ? (1 - lt / 1.0) * 40 : 0;

  const panelFade = useFade(lt, 16, 0.7);
  const panelOpacity = panelFade;
  const panelTX = lt < 17 ? (1 - panelFade) * 50 : 0;
  const scenePaddingX = scale < 0.72 ? 16 : 28;
  const sceneGap = showPanel ? (scale < 0.72 ? 12 : 18) : scale < 0.72 ? 24 : 36;

  return (
    <>
      <style>{`
        @keyframes zdPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(37,211,102,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(37,211,102,0.1); }
        }
        @keyframes zdPopIn {
          0% { opacity: 0; transform: translateY(-14px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .zdemo-scroll::-webkit-scrollbar { width: 3px; }
        .zdemo-scroll::-webkit-scrollbar-track { background: transparent; }
        .zdemo-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/*
        Wrapper: ocupa el ancho disponible y su altura se ajusta automáticamente
        al scale calculado (CANVAS_H * scale), para que nunca haya recorte.
        El canvas interno siempre es CANVAS_W × CANVAS_H px en píxeles lógicos
        y se escala uniformemente con transform: scale desde top-left.
        Así los textos, burbujas y cards conservan exactamente el mismo tamaño visual.
      */}
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          height: CANVAS_H * scale,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Canvas fijo 900×520 — escalado uniformemente */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Scene layout */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: sceneGap,
              padding: `20px ${scenePaddingX}px 28px`,
              transition: "gap 0.6s ease",
            }}
          >
            {/* Chat 1 — 252×460 fijos, igual que el HTML original */}
            <div
              style={{
                opacity: c1Opacity,
                transform: `translateX(${c1TX}px)`,
                width: 252,
                height: 460,
                flexShrink: 0,
              }}
            >
              <Phone
                title={ind.name1}
                messages={msgs1}
                typing={typing1}
                link={link}
                lt={lt}
              />
            </div>

            {/* Chat 2 */}
            <div
              style={{
                opacity: c2Opacity,
                transform: `translateX(${c2TX}px)`,
                width: 252,
                height: 460,
                flexShrink: 0,
              }}
            >
              <Phone
                title={ind.name2}
                messages={msgs2}
                typing={typing2}
                link={link}
                lt={lt}
              />
            </div>

            {/* Panel */}
            {showPanel && (
              <div
                style={{
                  opacity: panelOpacity,
                  transform: `translateX(${panelTX}px)`,
                  width: 284,
                  height: 460,
                  flexShrink: 0,
                }}
              >
                <Panel
                  orders={orderDefs}
                  statuses={[getStatus(0), getStatus(1)]}
                  newFlags={[lt >= 16.5 && lt < 17.2, lt >= 18.5 && lt < 19.2]}
                  accentColor={iColor}
                  lt={lt}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
