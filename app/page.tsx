"use client";
import { useState, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type PetType = "duck" | "cat" | "bear";
type Tab = "home" | "shop" | "vip" | "stats";

interface GameState {
  petType: PetType | null;
  stage: number;
  xp: number;
  happiness: number;
  streak: number;
  lastCheckIn: string | null;
  coins: number;
  unlockedOutfits: string[];
  activeOutfit: string | null;
  isVIP: boolean;
  totalCheckIns: number;
  achievements: string[];
}

interface BobaPhoto {
  id: string;
  date: string;
  dataUrl: string;
  timestamp: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGE_NAMES = ["Egg", "Baby", "Chibi", "Teen", "Legend"];
const XP_PER_STAGE = [10, 25, 40, 60, 999];

const PET_DATA: Record<PetType, { name: string; stages: string[]; color: string; desc: string }> = {
  duck:  { name: "Ducky",    stages: ["🥚", "🐣", "🐥", "🦆", "🦆"], color: "#ffd93d", desc: "Sweet & bubbly"  },
  cat:   { name: "Mochi",    stages: ["🥚", "🐣", "🐱", "😸", "🐈"], color: "#f472b6", desc: "Sassy & cute"    },
  bear:  { name: "Tapioca",  stages: ["🥚", "🐣", "🐻", "🐼", "🐼"], color: "#a78bfa", desc: "Chill & cozy"   },
};

const OUTFITS = [
  { id: "bow",     name: "Bow",     emoji: "🎀", price: 30,  vipOnly: false },
  { id: "crown",   name: "Crown",   emoji: "👑", price: 60,  vipOnly: false },
  { id: "star",    name: "Stars",   emoji: "⭐", price: 40,  vipOnly: false },
  { id: "flower",  name: "Flower",  emoji: "🌸", price: 50,  vipOnly: false },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", price: 120, vipOnly: false },
  { id: "wings",   name: "Wings",   emoji: "🪽", price: 0,   vipOnly: true  },
  { id: "magic",   name: "Magic",   emoji: "🔮", price: 0,   vipOnly: true  },
  { id: "fire",    name: "Hype",    emoji: "🔥", price: 0,   vipOnly: true  },
];

const ITEMS = [
  { id: "boba",  name: "Boba Refill",  emoji: "🧋", price: 10, boost: 20, desc: "+20 happiness" },
  { id: "mochi", name: "Mochi Cake",   emoji: "🍡", price: 25, boost: 45, desc: "+45 happiness" },
  { id: "heart", name: "Love Bomb",    emoji: "💖", price: 50, boost: 80, desc: "+80 happiness" },
];

const ACHIEVEMENTS_DEF = [
  { id: "first",     icon: "🎉", name: "First Sip",        desc: "Check in for the first time",   check: (g: GameState) => g.totalCheckIns >= 1           },
  { id: "streak3",   icon: "🔥", name: "On a Roll",         desc: "Reach a 3-day streak",          check: (g: GameState) => g.streak >= 3                  },
  { id: "streak7",   icon: "💫", name: "Week Warrior",      desc: "Reach a 7-day streak",          check: (g: GameState) => g.streak >= 7                  },
  { id: "stage2",    icon: "🌱", name: "Growing Up",        desc: "Reach Chibi stage",             check: (g: GameState) => g.stage >= 2                   },
  { id: "legend",    icon: "👑", name: "Boba Legend",       desc: "Reach Legend stage",            check: (g: GameState) => g.stage >= 4                   },
  { id: "rich",      icon: "💰", name: "Boba Rich",         desc: "Accumulate 200 coins",          check: (g: GameState) => g.coins >= 200                 },
  { id: "fashion",   icon: "✨", name: "Fashionista",       desc: "Unlock 3 outfits",              check: (g: GameState) => g.unlockedOutfits.length >= 3  },
  { id: "loyal",     icon: "🧡", name: "Loyal Sipper",      desc: "30 total check-ins",            check: (g: GameState) => g.totalCheckIns >= 30          },
];

const DEFAULT_STATE: GameState = {
  petType: null, stage: 0, xp: 0, happiness: 80, streak: 0,
  lastCheckIn: null, coins: 20, unlockedOutfits: [], activeOutfit: null,
  isVIP: false, totalCheckIns: 0, achievements: [],
};

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:        "radial-gradient(ellipse at top, #1a0a2e 0%, #080818 70%)",
  card:      "linear-gradient(180deg, #1a1030 0%, #0f0f24 100%)",
  header:    "linear-gradient(135deg, #2d1b69, #1e1040)",
  purple:    "#a78bfa",
  pink:      "#f472b6",
  gold:      "#fbbf24",
  teal:      "#2dd4bf",
  green:     "#4ade80",
  red:       "#f87171",
  orange:    "#fb923c",
  text:      "#e2d9f3",
  muted:     "#9d8ec5",
  dim:       "rgba(255,255,255,0.04)",
  dimBorder: "rgba(255,255,255,0.06)",
  cardBorder:"rgba(167,139,250,0.25)",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 2px; }

  @keyframes float    { 0%,100% { transform: translateY(0);    } 50% { transform: translateY(-8px); } }
  @keyframes bounce   { 0%,100% { transform: scale(1);          } 30% { transform: scale(1.35);     } 70% { transform: scale(0.92); } }
  @keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp  { from { opacity:0; transform:translateY(16px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes glow     { 0%,100% { box-shadow: 0 0 20px rgba(167,139,250,0.2); } 50% { box-shadow: 0 0 50px rgba(167,139,250,0.5), 0 0 80px rgba(244,114,182,0.2); } }
  @keyframes popStar  { 0% { transform: scale(0) rotate(0deg); opacity:1; } 100% { transform: scale(2.5) rotate(200deg); opacity:0; } }
  @keyframes heartbeat{ 0%,100%{transform:scale(1);} 14%{transform:scale(1.18);} 28%{transform:scale(1);} 42%{transform:scale(1.18);} }
  @keyframes shimmer  { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes scaleIn  { from { transform: scale(0.88) translateY(16px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
  @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }

  .pet-float  { animation: float 3s ease-in-out infinite; }
  .pet-bounce { animation: bounce 0.55s ease-in-out; }
  .glow-card  { animation: glow 4s ease-in-out infinite; }
  .fade-down  { animation: fadeDown 0.3s ease-out; }
  .slide-up   { animation: slideUp 0.3s ease-out; }
  .heartbeat  { animation: heartbeat 1.5s ease infinite; }
  .scale-in   { animation: scaleIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .fade-in    { animation: fadeIn 0.2s ease-out; }

  .boba-btn {
    position: relative; overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .boba-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .boba-btn:active:not(:disabled){ transform: scale(0.97); }

  .tab-btn { transition: color 0.2s, border-color 0.2s; }
  .tab-btn:hover span { color: #c4b5fd !important; }

  .outfit-btn { transition: transform 0.15s ease, border-color 0.2s; }
  .outfit-btn:hover { transform: scale(1.06) translateY(-2px); }

  .pet-select-card { transition: transform 0.2s ease, border-color 0.2s, box-shadow 0.2s; }
  .pet-select-card:hover {
    transform: scale(1.05) translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  }

  .photo-thumb {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .photo-thumb:hover {
    transform: scale(1.04);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  .cam-btn {
    transition: transform 0.15s ease, background 0.2s, border-color 0.2s;
  }
  .cam-btn:hover {
    transform: translateY(-2px);
    background: rgba(167,139,250,0.2) !important;
    border-color: rgba(167,139,250,0.5) !important;
  }
  .cam-btn:active { transform: scale(0.95); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Bar({ pct, color, glow }: { pct: number; color: string; glow?: boolean }) {
  return (
    <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, pct)}%`,
        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        borderRadius: 4, transition: "width 0.6s ease",
        boxShadow: glow ? `0 0 8px ${color}88` : "none",
      }} />
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ background: C.dim, borderRadius: 14, padding: "12px 10px", border: `1px solid ${C.dimBorder}`, textAlign: "center" }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? C.text, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Image resize helper ──────────────────────────────────────────────────────
function resizeImage(file: File, maxPx = 900): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else { width = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.src = url;
  });
}

// ─── Photo Modal ──────────────────────────────────────────────────────────────
function PhotoModal({ onClose, onPhoto }: { onClose: () => void; onPhoto: (dataUrl: string) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    onPhoto(dataUrl);
  };

  return (
    <div
      className="fade-in"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,2,15,0.82)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 12px 12px",
      }}
    >
      <div
        className="scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: "linear-gradient(180deg, #221448 0%, #100d28 100%)",
          borderRadius: 26, border: "1px solid rgba(167,139,250,0.35)",
          padding: "28px 22px 22px",
          boxShadow: "0 -4px 60px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: "rgba(167,139,250,0.3)", borderRadius: 2, margin: "0 auto 22px" }} />

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 44, marginBottom: 8, filter: "drop-shadow(0 0 16px rgba(167,139,250,0.5))" }}>📸</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f0e6ff", letterSpacing: -0.3 }}>Add a Boba Photo</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>Capture your boba moment! ✨</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => cameraRef.current?.click()}
            className="boba-btn"
            style={{
              padding: "15px 0", borderRadius: 15, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
            }}
          >
            <span style={{ fontSize: 20 }}>📷</span> Take Photo
          </button>

          <button
            onClick={() => galleryRef.current?.click()}
            className="boba-btn"
            style={{
              padding: "15px 0", borderRadius: 15,
              border: "1px solid rgba(167,139,250,0.35)",
              background: "rgba(167,139,250,0.1)",
              color: C.text, fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            }}
          >
            <span style={{ fontSize: 20 }}>🖼️</span> Choose from Gallery
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "12px 0", borderRadius: 14, border: "none",
              background: "transparent", color: C.muted,
              fontSize: 13, cursor: "pointer", fontWeight: 600,
              marginTop: 2,
            }}
          >
            Skip for now
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photo, onClose, onDelete }: { photo: BobaPhoto; onClose: () => void; onDelete: (id: string) => void }) {
  return (
    <div
      className="fade-in"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(4,2,15,0.95)", backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="scale-in" onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 400, width: "100%" }}>
        <img
          src={photo.dataUrl}
          alt="Boba photo"
          style={{
            maxWidth: "100%", maxHeight: "65vh",
            borderRadius: 22, objectFit: "contain",
            boxShadow: "0 0 0 1px rgba(167,139,250,0.3), 0 20px 80px rgba(124,58,237,0.4), 0 0 100px rgba(0,0,0,0.8)",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, color: "#f0e6ff", fontWeight: 700 }}>🧋 {photo.date}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Tap outside to close</div>
        </div>
        <button
          onClick={() => { onDelete(photo.id); onClose(); }}
          style={{
            padding: "9px 22px", borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)",
            color: C.red, fontSize: 13, cursor: "pointer", fontWeight: 700,
          }}
        >
          🗑️ Delete Photo
        </button>
      </div>
    </div>
  );
}

// ─── Pet Select Screen ────────────────────────────────────────────────────────
function PetSelectScreen({ onSelect }: { onSelect: (t: PetType) => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }} className="slide-up">
        <div style={{ fontSize: 56, marginBottom: 8 }} className="pet-float">🧋</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f0e6ff", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
          Boba Pet
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 36, lineHeight: 1.5 }}>
          Check in every time you drink boba<br />and watch your pet grow! 🌱
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          {(Object.keys(PET_DATA) as PetType[]).map(type => {
            const p = PET_DATA[type];
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="pet-select-card"
                style={{
                  flex: 1, padding: "20px 8px", borderRadius: 22,
                  background: `linear-gradient(160deg, ${p.color}14, rgba(255,255,255,0.03))`,
                  border: `2px solid ${p.color}44`, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }} className="pet-float">
                  <span style={{ fontSize: 26, lineHeight: 1 }}>🧋</span>
                  <span style={{ fontSize: 50, lineHeight: 1, marginTop: -6 }}>{p.stages[2]}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: p.color, marginTop: 6 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.desc}</div>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: "rgba(167,139,250,0.35)", marginTop: 28 }}>
          Your progress is saved locally 🔒
        </p>
      </div>
    </div>
  );
}

// ─── Star Burst ───────────────────────────────────────────────────────────────
function StarBurst() {
  const stars = ["✨", "⭐", "💫", "✨", "💜", "⭐"];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
      {stars.map((s, i) => (
        <span key={i} style={{
          position: "absolute", fontSize: 18,
          animation: "popStar 0.9s ease-out forwards",
          animationDelay: `${i * 0.08}s`,
          transform: `rotate(${i * 60}deg) translateY(-55px)`,
        }}>{s}</span>
      ))}
    </div>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────
export default function BobaPetGame() {
  const [game, setGame] = useState<GameState>(DEFAULT_STATE);
  const [tab, setTab] = useState<Tab>("home");
  const [animating, setAnimating] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [notif, setNotif] = useState<{ msg: string; type: "good" | "warn" | "epic" } | null>(null);
  const [photos, setPhotos] = useState<BobaPhoto[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<BobaPhoto | null>(null);

  // Load save
  useEffect(() => {
    try {
      const s = localStorage.getItem("boba-pet-v1");
      if (s) setGame(JSON.parse(s));
    } catch {}
  }, []);

  // Auto-save
  useEffect(() => {
    if (game.petType) {
      try { localStorage.setItem("boba-pet-v1", JSON.stringify(game)); } catch {}
    }
  }, [game]);

  // Load photos
  useEffect(() => {
    try {
      const p = localStorage.getItem("boba-pet-photos");
      if (p) setPhotos(JSON.parse(p));
    } catch {}
  }, []);

  // Save photos
  useEffect(() => {
    try { localStorage.setItem("boba-pet-photos", JSON.stringify(photos)); } catch {}
  }, [photos]);

  // Happiness decay: −1 every 5 minutes
  useEffect(() => {
    const t = setInterval(() => {
      setGame(g => ({ ...g, happiness: Math.max(0, g.happiness - 1) }));
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const notify = (msg: string, type: "good" | "warn" | "epic" = "good") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3000);
  };

  const poke = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);
  };

  const addPhoto = (dataUrl: string) => {
    const photo: BobaPhoto = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      dataUrl,
      timestamp: Date.now(),
    };
    setPhotos(prev => [photo, ...prev]);
    setShowPhotoModal(false);
    notify("📸 Boba photo saved!", "good");
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    notify("Photo deleted", "warn");
  };

  // ── Check-in ──────────────────────────────────────────────────────────────
  const checkIn = () => {
    if (animating) return;
    const today = new Date().toDateString();
    if (game.lastCheckIn === today) {
      notify("Already checked in today! Come back tomorrow 🌙", "warn");
      return;
    }

    setBouncing(true);
    setAnimating(true);
    setShowStars(true);
    setTimeout(() => { setBouncing(false); setShowStars(false); }, 900);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const continued = game.lastCheckIn === yesterday.toDateString();
    const newStreak = continued ? game.streak + 1 : 1;

    const xpGain   = 10 + (game.isVIP ? 5 : 0) + (newStreak >= 7 ? 5 : 0);
    const coinGain = 5  + (game.isVIP ? 10 : 0) + Math.floor(newStreak / 3);

    let newXP    = game.xp + xpGain;
    let newStage = game.stage;
    const needed = XP_PER_STAGE[game.stage] ?? 999;
    let leveled  = false;

    if (newXP >= needed && newStage < 4) {
      newXP -= needed;
      newStage++;
      leveled = true;
    }

    const draft: GameState = {
      ...game,
      lastCheckIn: today,
      streak: newStreak,
      xp: newXP,
      stage: newStage,
      happiness: Math.min(100, game.happiness + 20),
      coins: game.coins + coinGain,
      totalCheckIns: game.totalCheckIns + 1,
    };

    const earned = ACHIEVEMENTS_DEF
      .filter(a => !game.achievements.includes(a.id) && a.check(draft))
      .map(a => a.id);

    setGame({ ...draft, achievements: [...game.achievements, ...earned] });

    setTimeout(() => {
      setAnimating(false);
      if (leveled) {
        notify(`🎉 EVOLVED to ${STAGE_NAMES[newStage]}!`, "epic");
      } else if (earned.length) {
        const a = ACHIEVEMENTS_DEF.find(x => x.id === earned[0])!;
        notify(`${a.icon} Achievement Unlocked: ${a.name}!`, "epic");
      } else {
        notify(`🧋 +${xpGain} XP  ·  +${coinGain} 💰  ·  ${newStreak} day streak 🔥`, "good");
      }
      // Prompt for photo after check-in
      setTimeout(() => setShowPhotoModal(true), 400);
    }, 950);
  };

  // ── Shop ──────────────────────────────────────────────────────────────────
  const buyOutfit = (o: typeof OUTFITS[0]) => {
    if (o.vipOnly && !game.isVIP) { notify("👑 VIP exclusive — subscribe to unlock!", "warn"); return; }
    if (game.unlockedOutfits.includes(o.id)) {
      setGame(g => ({ ...g, activeOutfit: g.activeOutfit === o.id ? null : o.id }));
      notify(game.activeOutfit === o.id ? "Outfit removed" : `${o.emoji} Wearing ${o.name}!`);
      return;
    }
    if (game.coins < o.price) { notify("💰 Not enough coins!", "warn"); return; }
    setGame(g => ({
      ...g, coins: g.coins - o.price,
      unlockedOutfits: [...g.unlockedOutfits, o.id],
      activeOutfit: o.id,
    }));
    notify(`${o.emoji} Unlocked ${o.name}!`, "good");
  };

  const buyItem = (item: typeof ITEMS[0]) => {
    if (game.coins < item.price) { notify("💰 Not enough coins!", "warn"); return; }
    setGame(g => ({ ...g, coins: g.coins - item.price, happiness: Math.min(100, g.happiness + item.boost) }));
    notify(`${item.emoji} ${item.name} used! ${item.desc}`, "good");
  };

  const activateVIP = () => {
    if (game.isVIP) { notify("You're already VIP! 👑", "warn"); return; }
    setGame(g => ({ ...g, isVIP: true, coins: g.coins + 100 }));
    notify("👑 Welcome to VIP Club! +100 bonus coins!", "epic");
  };

  const resetGame = () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    setGame(DEFAULT_STATE);
    setPhotos([]);
    setTab("home");
    try {
      localStorage.removeItem("boba-pet-v1");
      localStorage.removeItem("boba-pet-photos");
    } catch {}
  };

  // ── Guard: pet not chosen ─────────────────────────────────────────────────
  if (!game.petType) {
    return <PetSelectScreen onSelect={t => setGame(g => ({ ...g, petType: t }))} />;
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const pet         = PET_DATA[game.petType];
  const sprite      = pet.stages[Math.min(game.stage, 4)];
  const outfit      = OUTFITS.find(o => o.id === game.activeOutfit);
  const xpNeeded    = XP_PER_STAGE[game.stage] ?? 999;
  const xpPct       = game.stage >= 4 ? 100 : Math.min(100, (game.xp / xpNeeded) * 100);
  const checkedToday= game.lastCheckIn === new Date().toDateString();
  const petFontSize = [60, 68, 80, 92, 108][game.stage] ?? 92;
  const hpColor     = game.happiness > 60 ? C.green : game.happiness > 30 ? C.gold : C.red;
  const latestPhoto = photos[0] ?? null;

  const moodText =
    game.happiness > 80 ? "Absolutely vibing 🌟" :
    game.happiness > 60 ? "Happy sipping ☕" :
    game.happiness > 40 ? "Could use a boba... 😐" :
    game.happiness > 20 ? "Getting thirsty 😟" :
                          "NEEDS BOBA NOW 😭";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 8px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Notification toast */}
      {notif && (
        <div className="fade-down" style={{
          position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, padding: "12px 20px", borderRadius: 16, fontSize: 13,
          fontWeight: 700, color: "white", whiteSpace: "nowrap", maxWidth: "92vw",
          textAlign: "center", pointerEvents: "none",
          background: notif.type === "epic" ? "linear-gradient(135deg,#7c3aed,#db2777)"
                    : notif.type === "warn" ? "linear-gradient(135deg,#92400e,#b45309)"
                    : "linear-gradient(135deg,#065f46,#047857)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}>
          {notif.msg}
        </div>
      )}

      {/* Game card */}
      <div className="glow-card" style={{ width: "100%", maxWidth: 400, background: C.card, borderRadius: 28, border: `1px solid ${C.cardBorder}`, overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ background: C.header, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f0e6ff", letterSpacing: 0.3 }}>
              🧋 {pet.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {STAGE_NAMES[game.stage]} · Stage {game.stage + 1} / 5
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {game.isVIP && (
              <span style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 800, color: "white", letterSpacing: 0.5 }}>
                VIP ✨
              </span>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>💰 {game.coins}</div>
              <div style={{ fontSize: 11, color: C.muted }}>🔥 {game.streak} streak</div>
            </div>
          </div>
        </div>

        {/* ── Pet display ── */}
        <div style={{ padding: "22px 0 8px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minHeight: 200 }}>
          {showStars && <StarBurst />}

          {/* Optional outfit badge above boba */}
          {outfit && (
            <div style={{ fontSize: 22, marginBottom: -6, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))", zIndex: 1 }}>
              {outfit.emoji}
            </div>
          )}

          {/* Boba cup hat */}
          <div style={{ fontSize: 30, marginBottom: -12, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))", zIndex: 1 }}>
            🧋
          </div>

          {/* Pet sprite */}
          <div
            className={bouncing ? "pet-bounce" : "pet-float"}
            onClick={poke}
            style={{ fontSize: petFontSize, lineHeight: 1, cursor: "pointer", filter: `drop-shadow(0 0 20px ${pet.color}55)`, userSelect: "none" }}
            title="Click to poke your pet!"
          >
            {sprite}
          </div>

          {/* Legend sparkle ring */}
          {game.stage >= 4 && (
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, ${pet.color}18 0%, transparent 70%)`, pointerEvents: "none" }} />
          )}

          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{moodText}</div>
        </div>

        {/* ── Stats bars ── */}
        <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}>
              <span>💗 Happiness</span>
              <span style={{ color: hpColor, fontWeight: 700 }}>{game.happiness}%</span>
            </div>
            <Bar pct={game.happiness} color={hpColor} />
          </div>

          {game.stage < 4 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}>
                <span>⚡ XP → {STAGE_NAMES[game.stage + 1]}</span>
                <span style={{ color: C.purple, fontWeight: 700 }}>{game.xp} / {xpNeeded}</span>
              </div>
              <Bar pct={xpPct} color={C.purple} glow />
            </div>
          ) : (
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: C.gold, padding: "4px 0" }}>
              ✨ MAX LEVEL — BOBA LEGEND ✨
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {(["home", "shop", "vip", "stats"] as Tab[]).map(t => {
            const icons:  Record<Tab, string> = { home: "🏠", shop: "🛍️", vip: "👑", stats: "📊" };
            const labels: Record<Tab, string> = { home: "Home", shop: "Shop", vip: "VIP", stats: "Stats" };
            const active = t === tab;
            return (
              <button
                key={t} onClick={() => setTab(t)} className="tab-btn"
                style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, borderBottom: `2px solid ${active ? C.purple : "transparent"}` }}
              >
                <span style={{ fontSize: 18 }}>{icons[t]}</span>
                <span style={{ fontSize: 10, color: active ? C.purple : C.muted, fontWeight: active ? 800 : 400 }}>
                  {labels[t]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ padding: 16, minHeight: 260 }} className="slide-up" key={tab}>

          {/* HOME */}
          {tab === "home" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Check-in row + camera button */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="cam-btn"
                  title="Add a boba photo 📸"
                  style={{
                    width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                    border: "1px solid rgba(167,139,250,0.3)",
                    background: "rgba(167,139,250,0.08)",
                    color: C.purple, fontSize: 22, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}
                >
                  📷
                  {photos.length > 0 && (
                    <span style={{
                      position: "absolute", top: -5, right: -5,
                      background: "linear-gradient(135deg,#7c3aed,#db2777)",
                      color: "white", fontSize: 9, fontWeight: 800,
                      borderRadius: 999, padding: "2px 5px", minWidth: 16,
                      textAlign: "center", lineHeight: 1.4,
                    }}>
                      {photos.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={checkIn}
                  disabled={checkedToday || animating}
                  className="boba-btn"
                  style={{
                    flex: 1, height: 56, borderRadius: 16, border: "none",
                    background: checkedToday
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #7c3aed, #db2777)",
                    color: checkedToday ? C.muted : "white",
                    fontSize: 15, fontWeight: 800, cursor: checkedToday ? "not-allowed" : "pointer",
                    boxShadow: checkedToday ? "none" : "0 4px 24px rgba(124,58,237,0.45)",
                    letterSpacing: 0.3,
                  }}
                >
                  {animating ? "🧋 Sipping boba..." : checkedToday ? "✅ Checked In Today!" : "🧋 I Drank Boba!"}
                </button>
              </div>

              {/* Latest photo thumbnail */}
              {latestPhoto && (
                <div
                  onClick={() => setSelectedPhoto(latestPhoto)}
                  className="photo-thumb"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(167,139,250,0.06)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    borderRadius: 14, padding: "10px 12px",
                  }}
                >
                  <img
                    src={latestPhoto.dataUrl}
                    alt="Latest boba"
                    style={{
                      width: 54, height: 54, borderRadius: 11,
                      objectFit: "cover", flexShrink: 0,
                      border: "2px solid rgba(167,139,250,0.35)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Latest Sip 📸</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{latestPhoto.date}</div>
                    <div style={{ fontSize: 11, color: C.purple, marginTop: 2 }}>
                      {photos.length} photo{photos.length !== 1 ? "s" : ""} · tap to view
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: C.muted, flexShrink: 0 }}>›</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <StatCard icon="🔥" value={game.streak}         label="day streak" color={game.streak > 0 ? C.orange : C.muted} />
                <StatCard icon="🧋" value={game.totalCheckIns}  label="total sips"  color={C.teal}   />
                <StatCard icon="🏆" value={game.achievements.length} label="badges" color={C.gold}   />
              </div>

              <div style={{ background: C.dim, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.dimBorder}` }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>🎁 Daily Rewards</div>
                {[
                  { label: "Base reward",   val: "+10 XP · +5 💰"   },
                  { label: "3-day streak",  val: "+1 💰 bonus"       },
                  { label: "7-day streak",  val: "+5 XP bonus"       },
                  { label: "VIP member",    val: "+5 XP · +10 💰"    },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.muted }}>{r.label}</span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", fontSize: 11, color: C.muted }}>
                💡 Tap your pet to poke it! · 📷 Camera to add a photo
              </div>
            </div>
          )}

          {/* SHOP */}
          {tab === "shop" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>🎀 Outfits</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {OUTFITS.map(o => {
                  const owned  = game.unlockedOutfits.includes(o.id);
                  const active = game.activeOutfit === o.id;
                  const locked = o.vipOnly && !game.isVIP;
                  return (
                    <button
                      key={o.id} onClick={() => buyOutfit(o)} className="outfit-btn"
                      style={{
                        background: active ? "rgba(167,139,250,0.18)" : C.dim,
                        border: `1px solid ${active ? C.purple : locked ? "rgba(251,191,36,0.25)" : C.dimBorder}`,
                        borderRadius: 12, padding: "10px 4px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 26, filter: locked ? "grayscale(1) opacity(0.5)" : "none" }}>{o.emoji}</span>
                      <span style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>{o.name}</span>
                      {locked  ? <span style={{ fontSize: 9, color: C.gold }}>👑 VIP</span>
                       : owned ? <span style={{ fontSize: 9, color: active ? C.purple : C.green }}>{active ? "● ON" : "✓ owned"}</span>
                               : <span style={{ fontSize: 9, color: C.gold }}>💰 {o.price}</span>}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>💊 Happiness Items</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ITEMS.map(item => {
                  const canBuy = game.coins >= item.price;
                  return (
                    <button
                      key={item.id} onClick={() => buyItem(item)} className="boba-btn"
                      style={{
                        background: C.dim, border: `1px solid ${C.dimBorder}`,
                        borderRadius: 12, padding: "12px 14px",
                        cursor: canBuy ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", gap: 12,
                        opacity: canBuy ? 1 : 0.45, textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 30 }}>{item.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{item.desc}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>💰 {item.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIP */}
          {tab === "vip" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
              <div style={{ fontSize: 52 }} className="heartbeat">👑</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.gold, textAlign: "center" }}>
                Boba VIP Club
              </div>
              <div style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
                Unlock premium perks and grow your pet faster!
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { e: "⚡", t: "+5 XP per daily check-in"       },
                  { e: "💰", t: "+10 coins per daily check-in"    },
                  { e: "🪽", t: "Exclusive VIP-only outfits"      },
                  { e: "🌟", t: "Shiny gold VIP badge"            },
                  { e: "🎁", t: "100 bonus coins on signup"       },
                ].map((b, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: C.dim, borderRadius: 12, padding: "10px 14px",
                    border: "1px solid rgba(251,191,36,0.15)",
                  }}>
                    <span style={{ fontSize: 20 }}>{b.e}</span>
                    <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{b.t}</span>
                    {game.isVIP && <span style={{ fontSize: 13, color: C.green }}>✓</span>}
                  </div>
                ))}
              </div>

              {game.isVIP ? (
                <div style={{
                  width: "100%", padding: 16, borderRadius: 16, textAlign: "center",
                  background: "linear-gradient(135deg, #78350f, #92400e)",
                  border: "1px solid rgba(251,191,36,0.3)",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>✨ You're VIP! ✨</div>
                  <div style={{ fontSize: 12, color: "#fcd34d", marginTop: 4 }}>Enjoying all premium perks</div>
                </div>
              ) : (
                <button onClick={activateVIP} className="boba-btn" style={{
                  width: "100%", padding: 16, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(245,158,11,0.4)", letterSpacing: 0.3,
                }}>
                  👑 Go VIP — Free (Demo)
                </button>
              )}

              <div style={{ fontSize: 11, color: "rgba(167,139,250,0.35)", textAlign: "center", lineHeight: 1.6 }}>
                Demo mode — connect a payment provider<br />to enable real subscriptions.
              </div>
            </div>
          )}

          {/* STATS */}
          {tab === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Boba Photo Gallery */}
              {photos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>
                      📸 Boba Gallery
                    </div>
                    <div style={{ fontSize: 11, color: C.purple, fontWeight: 600 }}>
                      {photos.length} photo{photos.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {photos.map(photo => (
                      <div
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        className="photo-thumb"
                        style={{
                          borderRadius: 13, overflow: "hidden",
                          border: "1px solid rgba(167,139,250,0.2)",
                          background: C.dim,
                        }}
                      >
                        <img
                          src={photo.dataUrl}
                          alt="Boba"
                          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                          padding: "4px 6px",
                          background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
                          fontSize: 9, color: C.muted, textAlign: "center",
                          marginTop: -20, position: "relative",
                        }}>
                          {photo.date}
                        </div>
                      </div>
                    ))}
                    {/* Add photo button in grid */}
                    <div
                      onClick={() => setShowPhotoModal(true)}
                      className="photo-thumb"
                      style={{
                        borderRadius: 13, aspectRatio: "1",
                        border: "1px dashed rgba(167,139,250,0.3)",
                        background: "rgba(167,139,250,0.05)",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ fontSize: 9, color: C.purple, fontWeight: 700 }}>Add</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setShowPhotoModal(true)}
                  className="photo-thumb"
                  style={{
                    borderRadius: 16, padding: "22px 14px",
                    border: "1px dashed rgba(167,139,250,0.25)",
                    background: "rgba(167,139,250,0.04)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 36 }}>📸</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No boba photos yet</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Tap to add your first boba photo!</div>
                </div>
              )}

              <div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>
                🏆 Achievements ({game.achievements.length} / {ACHIEVEMENTS_DEF.length})
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ACHIEVEMENTS_DEF.map(a => {
                  const done = game.achievements.includes(a.id);
                  return (
                    <div key={a.id} style={{
                      background: done ? "rgba(167,139,250,0.1)" : C.dim,
                      border: `1px solid ${done ? "rgba(167,139,250,0.3)" : C.dimBorder}`,
                      borderRadius: 12, padding: "10px 12px",
                      filter: done ? "none" : "grayscale(0.6) opacity(0.45)",
                    }}>
                      <div style={{ fontSize: 26 }}>{a.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: done ? C.text : C.muted, marginTop: 4 }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{a.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: C.dim, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.dimBorder}` }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>📋 Profile</div>
                {[
                  { label: "Pet",          val: `${pet.name} (${game.petType})` },
                  { label: "Stage",        val: STAGE_NAMES[game.stage]         },
                  { label: "Total sips",   val: game.totalCheckIns              },
                  { label: "Best streak",  val: `${game.streak} days`           },
                  { label: "Coins earned", val: game.coins                      },
                  { label: "Outfits",      val: `${game.unlockedOutfits.length} / ${OUTFITS.filter(o => !o.vipOnly).length}` },
                  { label: "Boba photos",  val: photos.length                   },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: C.muted }}>{r.label}</span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <button onClick={resetGame} style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12, padding: "10px 0", color: C.red,
                fontSize: 13, cursor: "pointer", fontWeight: 700, width: "100%",
              }}>
                🗑️ Reset Game
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center", fontSize: 11, color: "rgba(167,139,250,0.3)" }}>
          🧋 Boba Pet · Keep sipping, keep growing
        </div>

      </div>

      {/* Photo modal */}
      {showPhotoModal && (
        <PhotoModal onClose={() => setShowPhotoModal(false)} onPhoto={addPhoto} />
      )}

      {/* Photo lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={deletePhoto}
        />
      )}
    </div>
  );
}
