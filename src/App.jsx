import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import {
  Home, MessageCircle, Mic, Map as MapIcon, Info, User, FileText, Send, Plus,
  Check, CheckCircle2, Clock, ChevronRight, ChevronLeft, X, Users, BarChart3,
  Bell, Phone, Search, Filter, Paperclip, Lock, ArrowLeft, AlertTriangle,
  MessageSquare, ClipboardList, Heart, HelpCircle, Volume2, Building2,
  ShieldCheck, UserCog, ScrollText, Siren, LogOut, Settings, Eye, EyeOff,
  MapPin, PhoneCall, ChevronDown, Trash2
} from "lucide-react";
import MAP_IMG from "./assets/map.jpg";
import LOGO_IMG from "./assets/logo.png";
const CategoryChart = lazy(() => import("./CategoryChart"));
import { auth, db } from "./firebase";
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, onSnapshot, collection, collectionGroup, query, orderBy,
  updateDoc, arrayUnion, arrayRemove, addDoc,
} from "firebase/firestore";




/* ---------------------------------- tokens ---------------------------------- */
const C = {
  bg: "#FBFAF2",
  surface: "#FFFFFF",
  ink: "#1E2A1F",
  inkSoft: "#57634F",
  inkFaint: "#8B9583",
  primary: "#1E7A3D",
  primaryDark: "#12522A",
  primarySoft: "#E1F4E4",
  gold: "#E8A417",
  goldDark: "#B87F0E",
  goldSoft: "#FCEFD2",
  sos: "#D6402F",
  sosDark: "#A32E20",
  sosSoft: "#FBE7E3",
  line: "#E7E3CE",
  lineStrong: "#D8D2B4",
  danger: "#D6402F",
  ok: "#1E7A3D",
};
const serif = { fontFamily: "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif" };

const STATUS_FLOW = ["Submitted", "Received", "Under Review", "Assigned to Counselor", "Follow-Up", "Resolved"];
const CATEGORY_DEFAULTS = ["Bullying", "Cyberbullying", "Harassment", "Threat", "Physical incident", "Verbal incident", "Social exclusion", "Other"];

const COUNSELORS = [
  { id: "c1", name: "Mr. Terence Teodoro", role: "Counselor", availability: "Mon–Fri, 8:00–5:00", office: "Guidance Office, Rm 104", bio: "Handles bullying, peer conflict, and emotional support." },
  { id: "c2", name: "Ms. Alice Celebrado", role: "Counselor", availability: "Mon–Thu, 9:00–4:00", office: "Guidance Office, Rm 104", bio: "Handles personal concerns, anxiety, and follow-up support." },
  { id: "c3", name: "Ms. Louis Roldan", role: "Counselor", availability: "Mon–Fri, 7:30–4:30", office: "Guidance Office, Rm 104", bio: "First point of contact for wellbeing check-ins and referrals." },
];

const MOOD_OPTIONS = [
  { id: "great", emoji: "😄", label: "Great" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "down", emoji: "🙁", label: "Down" },
  { id: "struggling", emoji: "😢", label: "Struggling" },
];

const DEPARTMENTS = [
  { id: "clinic", name: "University Clinic", icon: Heart, contact: "0919 063 7846", hours: "During school days", desc: "For injuries, feeling unwell, or if you need to see the school nurse urgently." },
  { id: "discipline", name: "Prefect of Discipline", icon: ShieldCheck, contact: "0917 303 7880", hours: "Mrs. Margaret G. Pabico", desc: "For on-campus safety concerns, an incident happening right now, or matters of student discipline." },
];

const EMERGENCY_NUMBERS = [
  { group: "Off-campus", items: [
    { label: "Naga City Police Office", num: "0908 325 4787" },
    { label: "Central Command Center", num: "0963 220 9700" },
    { label: "Bureau of Fire Protection", num: "0923 083 9429" },
    { label: "Naga City Hospital", num: "881 9548 / 881 9466" },
  ]},
];

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const now = () => Date.now();
const fmtTime = (d) => new Date(d?.toDate ? d.toDate() : d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function fileToCompressedDataURL(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) { resolve({ name: file.name, dataUrl: null }); return; }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve({ name: file.name, dataUrl: canvas.toDataURL("image/jpeg", quality) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function useIsDesktop(bp = 880) {
  const [d, setD] = useState(typeof window !== "undefined" ? window.innerWidth >= bp : true);
  useEffect(() => {
    const onResize = () => setD(window.innerWidth >= bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);
  return d;
}

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  .arise-site { width: 100%; min-height: 100vh; background: ${C.bg}; }
  .arise-header { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #fff; border-bottom: 3px solid ${C.gold}; box-shadow: 0 1px 0 ${C.line}; }
  .arise-body { display: block; }
  .content-col { max-width: 620px; margin: 0 auto; width: 100%; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dashboard-shell { display: block; }
  .dashboard-main { min-width: 0; }
  .role-sidebar { display: none; }
  .role-tabbar { display: flex; }
  .student-nav { display: flex; order: 2; position: sticky; bottom: 0; border-top: 1px solid ${C.line}; }
  .wide-panel { max-width: 620px; margin: 0 auto; width: 100%; }
  @media (min-width: 880px) {
    .arise-header { padding: 16px 40px; }
    .content-col { max-width: 720px; padding: 0 8px; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
    .dashboard-shell { display: grid; grid-template-columns: 232px 1fr; align-items: start; min-height: calc(100vh - 61px); }
    .role-sidebar { display: flex; flex-direction: column; gap: 2px; padding: 18px 12px; border-right: 1px solid ${C.line}; background: #fff; position: sticky; top: 61px; height: calc(100vh - 61px); }
    .role-tabbar { display: none; }
    .student-nav { order: 0; position: static; border-top: none; border-bottom: 1px solid ${C.line}; max-width: 720px; margin: 0 auto; }
    .wide-panel { max-width: 900px; padding: 0 8px; }
  }
`;

/* ---------------------------------- small ui ---------------------------------- */
function Btn({ children, onClick, variant = "primary", full, disabled, style, type = "button" }) {
  const base = { border: "none", borderRadius: 12, padding: "13px 18px", fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity .15s", opacity: disabled ? 0.5 : 1, width: full ? "100%" : undefined };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    sos: { background: C.sos, color: "#fff" },
    outline: { background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}` },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
    subtle: { background: C.primarySoft, color: C.primaryDark },
    danger: { background: "transparent", color: C.sos, border: `1.5px solid ${C.sos}` },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const resolved = status === "Resolved" || status === "Closed";
  const active = status === "Active" || status === "Responding";
  const color = resolved ? C.primary : active ? C.sos : C.gold;
  const bg = resolved ? C.primarySoft : active ? C.sosSoft : C.goldSoft;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, background: bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px 12px", borderBottom: `1px solid ${C.line}`, background: C.surface }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 style={{ ...serif, fontSize: 19, fontWeight: 700, color: C.ink, margin: 0, flex: 1 }}>{title}</h1>
      {right}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{children}</label>
      {hint && <p style={{ fontSize: 12, color: C.inkFaint, margin: "2px 0 0" }}>{hint}</p>}
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "11px 12px", fontSize: 14.5, color: C.ink, background: "#fff", fontFamily: "inherit" };

/* ---------------------------------- onboarding ---------------------------------- */
const ONBOARD_SLIDES = [
  { icon: Heart, title: "You don't have to face it alone", body: "ARISE helps students report bullying and school-safety concerns, get support, and reach a counselor quickly and privately." },
  { icon: FileText, title: "Report what happened", body: "Fill out a short, guided form. You can attach photos or screenshots, and choose to stay anonymous." },
  { icon: Siren, title: "SOS when it's urgent", body: "If you need help right now, one tap alerts your school's designated personnel. No automatic outside calls unless your school configures that." },
  { icon: Users, title: "Talk to a counselor", body: "See who's available, message them directly, and request a session or follow-up." },
  { icon: MessageCircle, title: "Aira is here too", body: "Aira gives general emotional support and guidance, day or night. Aira is not a counselor and never replaces one." },
  { icon: Lock, title: "Your privacy matters", body: "Only people authorized to help you can see your report. You control what you share." },
];

/* ---------------------------------- Auth (sign in / sign up) ---------------------------------- */
function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", cred.user.uid), { name: name.trim(), email: email.trim(), role });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSignedIn?.();
    } catch (e) {
      setErr(e.message?.replace("Firebase: ", "") || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ ...serif, fontSize: 24, color: C.primary, fontWeight: 700, margin: "0 0 2px" }}>A.R.I.S.E.</p>
          <p style={{ fontSize: 12.5, color: C.inkFaint, margin: 0 }}>{mode === "login" ? "Sign in to continue" : "Create your account"}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div><FieldLabel>Full name</FieldLabel><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></div>
          )}
          <div><FieldLabel>Email</FieldLabel><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></div>
          <div><FieldLabel>Password</FieldLabel><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></div>
          {mode === "signup" && (
            <div>
              <FieldLabel>I am a</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ id: "student", label: "Student" }, { id: "counselor", label: "Counselor" }, { id: "admin", label: "Admin" }].map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", border: `1.5px solid ${role === r.id ? C.primary : C.line}`, background: role === r.id ? C.primarySoft : "#fff", color: role === r.id ? C.primaryDark : C.inkSoft, fontWeight: role === r.id ? 700 : 500 }}>{r.label}</button>
                ))}
              </div>
            </div>
          )}
          {err && <p style={{ fontSize: 12.5, color: C.sos, margin: 0 }}>{err}</p>}
          <Btn full disabled={busy || !email || !password} onClick={submit}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Btn>
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: C.inkSoft, marginTop: 18 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12.5 }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const last = i === ONBOARD_SLIDES.length - 1;
  const S = ONBOARD_SLIDES[i];
  const iconBg = i % 2 === 0 ? C.gold : "rgba(255,255,255,.22)";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: `linear-gradient(160deg, ${C.primaryDark} 0%, ${C.primary} 55%, ${C.goldDark} 130%)`, color: "#fff", padding: 28, boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...serif, fontSize: 15, fontWeight: 700, letterSpacing: 0.5, color: C.gold }}>A.R.I.S.E.</span>
        <button onClick={onDone} style={{ background: "none", border: "none", color: "rgba(255,255,255,.75)", fontSize: 13, cursor: "pointer" }}>Skip</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 18 }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(0,0,0,.18)" }}>
          <S.icon size={30} color={i % 2 === 0 ? C.primaryDark : "#fff"} />
        </div>
        <h2 style={{ ...serif, fontSize: 23, margin: 0, lineHeight: 1.3 }}>{S.title}</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,.88)", maxWidth: 300, margin: 0 }}>{S.body}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 22 }}>
        {ONBOARD_SLIDES.map((_, idx) => (
          <div key={idx} style={{ width: idx === i ? 20 : 6, height: 6, borderRadius: 3, background: idx === i ? C.gold : "rgba(255,255,255,.35)", transition: "width .2s" }} />
        ))}
      </div>
      <Btn full variant="ghost" style={{ background: C.gold, color: C.primaryDark, border: "none", fontWeight: 800 }} onClick={() => (last ? onDone() : setI(i + 1))}>
        {last ? "Create or sign in to your account" : "Next"} <ChevronRight size={16} />
      </Btn>
    </div>
  );
}

/* ---------------------------------- Aira (rule-based support) ---------------------------------- */
const AIRA_RULES = [
  { test: /\b(kill myself|suicide|end my life|hurt myself|self.?harm|can'?t go on|want to die|not safe|in danger|being hurt right now|hes? hurting me|she'?s hurting me|gusto ko nang mamatay|ayoko na mabuhay)\b/i,
    reply: "I'm really concerned about what you just shared. If you're in danger or unsafe right now, please use the SOS button so school staff can help immediately, or talk to a trusted adult near you right now. You don't have to handle this alone." },
  { test: /\b(cyberbully|cyber.?bullying|online (harassment|bullying)|posted (photos|screenshots) of me|spreading rumors online|fake account|group chat.*(laugh|talking about me)|being sent hate)\b/i,
    reply: "Being targeted online can feel just as painful as in-person bullying — sometimes worse, since it can follow you everywhere. Try to save screenshots as proof before anything gets deleted, and don't respond to the person directly. You can report this through ARISE with those screenshots attached. Want me to walk you there?" },
  { test: /\b(bully|bullied|bullying|teasing|teased|picking on me|making fun of me|pushed me|hit me|punched|niloloko ako|inaaway ako)\b/i,
    reply: "I'm sorry that's happening to you — that's not okay, and it's not your fault. Reporting it through ARISE lets a counselor actually step in. Want me to walk you to Report a Concern, or would you rather talk to a counselor directly first?" },
  { test: /\b(exclu|left out|no one includes me|not invited|ignoring me|ignored me|hiniwalayan ako|iniiwasan ako)\b/i,
    reply: "Being left out on purpose is its own kind of hurtful, even if no one raised a hand or said a word. That's still something ARISE covers under 'Social exclusion' when you report — it's taken seriously, not brushed off." },
  { test: /\b(sad|depress|down|hopeless|worthless|crying|cry|malungkot|nalulungkot)\b/i,
    reply: "That sounds really heavy to be carrying. It's okay to feel this way, and you deserve support — a guidance counselor can help you work through it properly. Want me to show you who's available to talk to?" },
  { test: /\b(anxious|anxiety|nervous|panic|scared|afraid|worried|kinakabahan|natatakot)\b/i,
    reply: "That anxious feeling is exhausting, and it makes sense you'd want it to ease up. Try taking a few slow breaths while we talk — in for 4 counts, hold for 4, out for 6. If this keeps building, a school counselor can help you find ways to manage it long-term." },
  { test: /\b(exam|test|quiz|grades|failing|academic|deadline|project due|walang oras mag.?aral)\b/i,
    reply: "Academic pressure can build up fast, especially when it stacks on top of everything else going on. That's a completely valid thing to bring to a counselor too, not just bullying-related stuff — they can help with study stress and coping strategies." },
  { test: /\b(family|parents|mom and dad|magulang|kasambahay|siblings fight|utang)\b/i,
    reply: "Family situations can be really hard to carry on your own, especially while also dealing with school. A counselor can be a steady, judgment-free person to talk this through with — they're not just for bullying reports." },
  { test: /\b(angry|mad|frustrated|galit|nayayamot)\b/i,
    reply: "That frustration makes sense — bottling it up rarely helps. Whatever's making you feel this way, you don't have to sit with it alone. Want to tell me more, or would talking to a counselor feel more useful right now?" },
  { test: /\b(can'?t sleep|insomnia|hindi ako makatulog|tired all the time|exhausted)\b/i,
    reply: "Stress and worry can really mess with sleep. Try to keep your phone away from your pillow at night if you can, and if this has been going on a while, it's worth mentioning to a counselor — sleep and stress feed into each other a lot." },
  { test: /\b(ugly|hate my body|hate myself|not good enough|useless|di ako sapat)\b/i,
    reply: "I'm sorry you're feeling that way about yourself — that's a painful place to be, and it deserves real support, not a quick fix from me. A counselor can help you work through those feelings properly. You matter, even when it doesn't feel that way." },
  { test: /\b(gay|lesbian|lgbt|bakla|tomboy|different from others|sexuality|identity)\b/i,
    reply: "However you identify, you deserve to feel safe at school, and being targeted for it is bullying — full stop. ARISE counselors are there to support you without judgment. If anyone's giving you a hard time about it, that's absolutely worth reporting." },
  { test: /\b(peer pressure|kaibigan.*(force|pilit)|being pressured|ginigipit ako ng barkada)\b/i,
    reply: "Feeling pressured by people you're supposed to trust is confusing and stressful. You're allowed to say no to things that don't feel right, even to friends. A counselor can help you figure out how to handle it." },
  { test: /\b(alone|lonely|no one|nobody cares|no friends|mag.?isa lang ako)\b/i,
    reply: "Feeling alone in this is really hard, but you're not actually alone — there are people at your school ready to help, even if it doesn't feel that way right now. A counselor or a trusted adult is a good next step." },
  { test: /\b(who are the counselors|list of counselors|counselor names|sino ang counselor)\b/i,
    reply: "Right now you can reach Ms. Baby Villafuerte, Ms. Alice Celebrado, and Ms. Louis Roldan — you'll see their availability and can message or book a time with any of them from Voice Out." },
  { test: /\b(is this confidential|will anyone know|anonymous|private ba|malalaman ba nila)\b/i,
    reply: "You can choose to submit your report anonymously — that option is right there in the report form. Even when it's not anonymous, only the guidance staff handling your specific case can see it, never the whole school." },
  { test: /\b(what happens after i report|what happens next|ano ang mangyayari)\b/i,
    reply: "After you submit, your report status moves through: Submitted → Received → Under Review → Assigned to Counselor → Follow-Up → Resolved. You can track it anytime in My Reports, and a counselor may message you for more details or to set up a time to talk." },
  { test: /\b(what is sos|how does sos work|what does sos do)\b/i,
    reply: "SOS alerts school staff immediately that you need urgent help — it doesn't automatically call outside emergency services unless your school has set that up. Use it if you're unsafe or need help right now, not for general reporting." },
  { test: /\b(thank you|thanks|thank u|salamat)\b/i,
    reply: "You're welcome. I'm glad you reached out — that takes courage. I'm here whenever you need to talk again." },
  { test: /\b(hi|hello|hey|good morning|good afternoon|good evening|kumusta)\b/i,
    reply: "Hi there! I'm glad you're here. What's on your mind today?" },
  { test: /\b(bye|goodbye|got to go|gtg|see you|paalam)\b/i,
    reply: "Take care of yourself. Remember, SOS and the counselor list are always right here if you need them later." },
  { test: /\b(report|reporting|how do i report)\b/i,
    reply: "You can go to Report a Concern from the Home screen — it walks you through it step by step, you can attach photos or screenshots as proof, and you can choose to stay anonymous. Want me to explain what happens after you submit it?" },
  { test: /\b(counselor|counsellor|talk to someone|guidance|book a session|book a counselor)\b/i,
    reply: "You can reach a counselor anytime through Voice Out on the home screen — you can message them directly, or book a specific time to talk if you'd rather plan ahead." },
  { test: /\b(what can you do|what are you|who are you|help me with what)\b/i,
    reply: "I'm Aira — I'm here to listen, help you sort out what you're feeling, and point you toward the right next step, whether that's reporting something, talking to a counselor, or just getting something off your chest. I'm not a replacement for a real counselor, but I'm always available." },
];
const AIRA_FALLBACKS = [
  "Thank you for telling me that. Can you shut the fuck up?",
  "I hear you. What do you think would help most right now — reporting this, talking to a counselor, or just talking it through with me?",
  "That sounds like a lot to deal with. I'm listening — go on whenever you're ready.",
  "I want to understand better — can you tell me more about how long this has been going on?",
];

function airaReply(text) {
  for (const rule of AIRA_RULES) {
    if (rule.test.test(text)) return rule.reply;
  }
  return AIRA_FALLBACKS[Math.floor(Math.random() * AIRA_FALLBACKS.length)];
}

function AiraChat() {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: "Hi, I'm Aira. I'm here to listen and help you figure out your next step. What's going on?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    const reply = airaReply(text);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
      setLoading(false);
    }, 500 + Math.random() * 400);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 18px", background: C.primarySoft, fontSize: 12, color: C.primaryDark, lineHeight: 1.5 }}>
        Aira provides general support and guidance. It does not replace a school counselor or other qualified professional.
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{
              background: m.role === "user" ? C.primary : "#fff",
              color: m.role === "user" ? "#fff" : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
              borderRadius: 14,
              borderBottomRightRadius: m.role === "user" ? 4 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 4,
              padding: "10px 13px", fontSize: 14, lineHeight: 1.5,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12.5, color: C.inkFaint, alignSelf: "flex-start", padding: "0 4px" }}>Aira is typing…</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.line}`, background: "#fff" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type how you're feeling…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={send} aria-label="Send" style={{ background: C.primary, border: "none", borderRadius: 10, width: 42, color: "#fff", cursor: "pointer" }}><Send size={17} /></button>
      </div>
    </div>
  );
}

/* ---------------------------------- SOS flow ---------------------------------- */
function EmergencyLinkButton({ onOpen }) {
  return (
    <button onClick={onOpen} style={{ marginTop: 14, width: "100%", background: "none", border: `1.5px solid ${C.line}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: "11px 14px" }}>
      <PhoneCall size={15} color={C.primary} /> Security, Clinic &amp; emergency numbers <ChevronRight size={14} style={{ marginLeft: "auto" }} />
    </button>
  );
}

function EmergencyDepartments() {
  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 14, lineHeight: 1.6 }}>These departments can be reached directly for urgent, on-campus needs.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {DEPARTMENTS.map((d) => (
          <Card key={d.id}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <d.icon size={19} color={C.goldDark} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{d.name}</p>
                  <span style={{ color: C.primary, fontWeight: 700, fontSize: 13 }}>{d.contact}</span>
                </div>
                <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 4px" }}>{d.hours}</p>
                <p style={{ fontSize: 12.5, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{d.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: C.inkFaint, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.3 }}>Off-campus emergency numbers</p>
      {EMERGENCY_NUMBERS.map((g) => (
        <div key={g.group} style={{ marginBottom: 8 }}>
          {g.items.map((it) => (
            <div key={it.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontSize: 13.5 }}>
              <span style={{ color: C.ink }}>{it.label}</span>
              <span style={{ color: C.primary, fontWeight: 700 }}>{it.num}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SosFlow({ onCreate, activeRequest, onBack, onOpenDepartments }) {
  const [step, setStep] = useState(activeRequest ? "ack" : "ask");


  if (step === "ask") {
    return (
      <div style={{ padding: 22, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.inkFaint, alignSelf: "flex-start", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, padding: 0, marginBottom: 20 }}><ArrowLeft size={15} /> Back</button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.sosSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Siren size={28} color={C.sos} />
          </div>
          <h2 style={{ ...serif, fontSize: 21, margin: 0, color: C.ink }}>Are you in immediate danger or do you need urgent assistance?</h2>
          <p style={{ fontSize: 13.5, color: C.inkSoft, margin: 0, maxWidth: 280 }}>This will notify your school's designated personnel that you need help right now.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn full variant="sos" onClick={() => setStep("confirm")}>Request help</Btn>
          <Btn full variant="ghost" onClick={onBack}>Cancel</Btn>
        </div>
        <EmergencyLinkButton onOpen={onOpenDepartments} />
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div style={{ padding: 22, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center", gap: 14 }}>
          <AlertTriangle size={30} color={C.gold} />
          <h2 style={{ ...serif, fontSize: 19, margin: 0, color: C.ink }}>Confirm your request</h2>
          <p style={{ fontSize: 13.5, color: C.inkSoft, maxWidth: 280, margin: 0 }}>Your school's designated personnel will be alerted immediately with your account information. Only authorized staff can see this.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn full variant="sos" onClick={() => { onCreate(); setStep("ack"); }}>Yes, send request</Btn>
          <Btn full variant="ghost" onClick={() => setStep("ask")}>Go back</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 22, boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", padding: "22px 0" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <CheckCircle2 size={26} color={C.primary} />
        </div>
        <h2 style={{ ...serif, fontSize: 19, margin: "0 0 6px", color: C.ink }}>Your request has been received</h2>
        <p style={{ fontSize: 13.5, color: C.inkSoft, margin: 0 }}>Case {activeRequest?.id} · {activeRequest && fmtTime(activeRequest.timestamp)}</p>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Status</span>
          <StatusBadge status={activeRequest?.status || "Active"} />
        </div>
        <p style={{ fontSize: 12.5, color: C.inkFaint, margin: "8px 0 0" }}>{activeRequest?.assignedResponder ? `${activeRequest.assignedResponder} is responding.` : "Waiting for a staff member to respond."}</p>
      </Card>
      <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 4 }}>If you can, also tell a trusted adult nearby what's happening while you wait.</p>
      <EmergencyLinkButton onOpen={onOpenDepartments} />
    </div>
  );
}

/* ---------------------------------- Report an incident ---------------------------------- */
function ReportIncident({ categories, onSubmit, onCancel, onNeedsSos }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ category: "", what: "", when: "", where: "", who: "", witnesses: "", frequency: "", feelings: "", danger: "", anonymous: false, attachment: "", attachmentData: "" });
  const [attachBusy, setAttachBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const steps = ["Category", "Details", "People", "How you feel", "Review"];

  const canNext = [
    !!f.category,
    f.what.trim().length > 0 && f.when && f.where.trim().length > 0,
    !!f.frequency,
    f.feelings.trim().length > 0 && !!f.danger,
    true,
  ];

  if (f.danger === "Yes" && step === 3) {
    return (
      <div style={{ padding: 22, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, height: "100%", boxSizing: "border-box", justifyContent: "center" }}>
        <Siren size={30} color={C.sos} />
        <h2 style={{ ...serif, fontSize: 19, margin: 0 }}>If you're in danger right now, use SOS</h2>
        <p style={{ fontSize: 13.5, color: C.inkSoft, maxWidth: 280 }}>SOS reaches school personnel immediately. You can still finish this report afterward.</p>
        <Btn full variant="sos" onClick={onNeedsSos}>Go to SOS</Btn>
        <Btn full variant="ghost" onClick={() => set("danger", "No, but I want to report this")}>I'm safe right now, continue report</Btn>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 18px 0" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.primary : C.line }} />
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: C.inkFaint, margin: "4px 0 10px" }}>Step {step + 1} of {steps.length} · {steps[step]}</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 18px" }}>
        {step === 0 && (
          <div>
            <FieldLabel>What kind of incident is this?</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {categories.map((c) => (
                <button key={c} onClick={() => set("category", c)} style={{
                  padding: "9px 14px", borderRadius: 999, fontSize: 13.5, cursor: "pointer",
                  border: `1.5px solid ${f.category === c ? C.primary : C.line}`,
                  background: f.category === c ? C.primarySoft : "#fff",
                  color: f.category === c ? C.primaryDark : C.ink, fontWeight: f.category === c ? 700 : 500,
                }}>{c}</button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><FieldLabel>What happened?</FieldLabel><textarea rows={4} value={f.what} onChange={(e) => set("what", e.target.value)} placeholder="Describe what happened, in your own words." style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div><FieldLabel>When did it happen?</FieldLabel><input type="date" value={f.when} onChange={(e) => set("when", e.target.value)} style={inputStyle} /></div>
            <div><FieldLabel>Where did it happen?</FieldLabel><input value={f.where} onChange={(e) => set("where", e.target.value)} placeholder="e.g. Canteen, Rm 205, online" style={inputStyle} /></div>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><FieldLabel hint="Optional">Who was involved?</FieldLabel><input value={f.who} onChange={(e) => set("who", e.target.value)} style={inputStyle} /></div>
            <div><FieldLabel hint="Optional">Were there witnesses?</FieldLabel><input value={f.witnesses} onChange={(e) => set("witnesses", e.target.value)} style={inputStyle} /></div>
            <div>
              <FieldLabel>How often has this happened?</FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                {["This was the first time", "A few times", "This happens often"].map((o) => (
                  <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, border: `1.5px solid ${f.frequency === o ? C.primary : C.line}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", background: f.frequency === o ? C.primarySoft : "#fff" }}>
                    <input type="radio" checked={f.frequency === o} onChange={() => set("frequency", o)} /> {o}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><FieldLabel>How does this situation make you feel?</FieldLabel><textarea rows={3} value={f.feelings} onChange={(e) => set("feelings", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div>
              <FieldLabel>Are you in immediate danger right now?</FieldLabel>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <Btn variant={f.danger === "Yes" ? "sos" : "ghost"} onClick={() => set("danger", "Yes")}>Yes</Btn>
                <Btn variant={f.danger?.startsWith("No") ? "subtle" : "ghost"} onClick={() => set("danger", "No, but I want to report this")}>No</Btn>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "10px 12px" }}>
              <input type="checkbox" checked={f.anonymous} onChange={(e) => set("anonymous", e.target.checked)} /> I would like to remain anonymous
            </label>
            <div>
              <FieldLabel hint="Optional — a photo or screenshot as proof">Attachments</FieldLabel>
              <label style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px dashed ${C.line}`, borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 13.5, color: C.inkSoft }}>
                <Paperclip size={16} />
                {attachBusy ? "Processing…" : (f.attachment || "Attach a photo")}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAttachBusy(true);
                  const { name, dataUrl } = await fileToCompressedDataURL(file);
                  setF((s) => ({ ...s, attachment: name, attachmentData: dataUrl || "" }));
                  setAttachBusy(false);
                }} />
              </label>
              {f.attachmentData && (
                <img src={f.attachmentData} alt="Attachment preview" style={{ marginTop: 8, maxWidth: 140, borderRadius: 8, border: `1px solid ${C.line}` }} />
              )}
            </div>
            <Card style={{ background: C.primarySoft, borderColor: C.primarySoft }}>
              <p style={{ fontSize: 12.5, color: C.primaryDark, margin: 0, lineHeight: 1.6, display: "flex", gap: 8 }}>
                <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                Your report is only visible to your school's guidance counselors and authorized staff handling your case. It is never shown publicly.
              </p>
            </Card>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> I understand how my report will be handled
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, padding: 16, borderTop: `1px solid ${C.line}` }}>
        {step > 0 ? <Btn variant="ghost" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</Btn> : <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
        {step < steps.length - 1 ? (
          <Btn full disabled={!canNext[step]} onClick={() => setStep(step + 1)}>Continue <ChevronRight size={16} /></Btn>
        ) : (
          <Btn full disabled={!confirmed} onClick={() => onSubmit(f)}>Submit report</Btn>
        )}
      </div>
    </div>
  );
}

function ReportConfirmation({ report, onDone }) {
  return (
    <div style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", boxSizing: "border-box" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <CheckCircle2 size={26} color={C.primary} />
      </div>
      <h2 style={{ ...serif, fontSize: 20, margin: "0 0 6px" }}>Report submitted</h2>
      <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 18 }}>Thank you for speaking up. Your case ID is</p>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: 1, marginBottom: 18, ...serif }}>{report.id}</div>
      <Card style={{ width: "100%", textAlign: "left", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: C.inkSoft }}>Status</span>
          <StatusBadge status={report.status} />
        </div>
      </Card>
      <p style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 20, lineHeight: 1.6 }}>A guidance counselor will review this soon. You can track progress anytime in My Reports.</p>
      <Btn full onClick={onDone}>Done</Btn>
    </div>
  );
}

/* ---------------------------------- My reports ---------------------------------- */
function MyReports({ reports, onOpen }) {
  const mine = reports;
  return (
    <div style={{ padding: 16 }}>
      {mine.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.inkFaint }}>
          <FileText size={30} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13.5 }}>No reports yet. If something happened, reporting it is a good first step.</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mine.map((r) => (
          <Card key={r.id} onClick={() => onOpen(r)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{r.category}</p>
                <p style={{ fontSize: 12, color: C.inkFaint, margin: 0 }}>{r.id} · {r.when}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportTimeline({ report }) {
  const idx = STATUS_FLOW.indexOf(report.status);
  return (
    <div style={{ padding: 16 }}>
      <Card style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 4px" }}>{report.id}</p>
        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>{report.category}</p>
        <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>{report.what}</p>
        {report.attachmentData && (
          <img src={report.attachmentData} alt="Your attachment" style={{ marginTop: 10, maxWidth: "100%", borderRadius: 8, border: `1px solid ${C.line}`, display: "block" }} />
        )}
      </Card>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.3 }}>Progress</p>
      <div>
        {STATUS_FLOW.map((s, i) => (
          <div key={s} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: i <= idx ? C.primary : "#fff", border: `2px solid ${i <= idx ? C.primary : C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i <= idx && <Check size={12} color="#fff" />}
              </div>
              {i < STATUS_FLOW.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: i < idx ? C.primary : C.line }} />}
            </div>
            <div style={{ paddingBottom: 20 }}>
              <p style={{ fontWeight: i === idx ? 700 : 500, fontSize: 13.5, margin: 0, color: i <= idx ? C.ink : C.inkFaint }}>{s}</p>
              {report.counselorNotes && s === "Assigned to Counselor" && idx >= i && (
                <p style={{ fontSize: 12, color: C.inkFaint, margin: "3px 0 0" }}>Assigned to {report.assignedCounselor}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Talk to a counselor ---------------------------------- */
function CounselorChat({ counselor, thread, onSend, onBack, onOpen }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);
  useEffect(() => { onOpen?.(); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ArrowLeft size={18} /></button>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.primaryDark, fontWeight: 700, fontSize: 12 }}>
          {counselor.name.split(" ").map((n) => n[0]).slice(-2).join("")}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{counselor.name}</p>
          <p style={{ fontSize: 11.5, color: C.inkFaint, margin: 0 }}>{counselor.availability}</p>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {(thread || []).length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", marginTop: 30 }}>Say hello — messages here are only visible to you and {counselor.name}.</p>}
        {(thread || []).map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.from === "student" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{ background: m.from === "student" ? C.primary : "#fff", color: m.from === "student" ? "#fff" : C.ink, border: m.from === "student" ? "none" : `1px solid ${C.line}`, borderRadius: 14, padding: "10px 13px", fontSize: 14 }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.line}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { onSend(input); setInput(""); } }} placeholder="Write a message…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => { if (input.trim()) { onSend(input); setInput(""); } }} style={{ background: C.primary, border: "none", borderRadius: 10, width: 42, color: "#fff", cursor: "pointer" }}><Send size={17} /></button>
      </div>
    </div>
  );
}

function BookingForm({ counselor, onSubmit, onCancel }) {
  const [preferredWhen, setPreferredWhen] = useState("");
  const [note, setNote] = useState("");
  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 14 }}>Request a time with <strong>{counselor.name}</strong>. They'll confirm an exact time back to you.</p>
      <FieldLabel>Preferred day / time</FieldLabel>
      <input value={preferredWhen} onChange={(e) => setPreferredWhen(e.target.value)} placeholder="e.g. Friday afternoon, or anytime this week" style={{ ...inputStyle, marginBottom: 14 }} />
      <FieldLabel hint="Optional">What's this about?</FieldLabel>
      <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, resize: "vertical", marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn full disabled={!preferredWhen.trim()} onClick={() => onSubmit(note, preferredWhen)}>Send request</Btn>
      </div>
    </div>
  );
}

function VoiceOut({ threads, onSend, onMarkRead, bookings, me, onRequestBooking }) {
  const [selected, setSelected] = useState(null);
  const [booking, setBooking] = useState(null);
  const myBookings = (bookings || []).filter((b) => b.studentUid === me.uid);

  if (booking) {
    return <BookingForm counselor={booking} onCancel={() => setBooking(null)} onSubmit={(note, when) => { onRequestBooking(booking.id, note, when); setBooking(null); }} />;
  }
  if (selected) return <CounselorChat counselor={selected} thread={threads[selected.id]} onSend={(t) => onSend(selected.id, t)} onBack={() => setSelected(null)} onOpen={() => onMarkRead?.(selected.id)} />;
  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 14 }}>Choose a counselor to message directly or request a session.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: myBookings.length ? 22 : 0 }}>
        {COUNSELORS.map((c) => {
          const unread = (threads[c.id] || []).filter((m) => m.from === "counselor" && !m.read).length;
          return (
            <Card key={c.id}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.primaryDark, fontWeight: 700, fontSize: 13, flexShrink: 0, position: "relative" }}>
                  {c.name.split(" ").map((n) => n[0]).slice(-2).join("")}
                  {unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: C.sos, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{unread}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 4px" }}>{c.role} · {c.office}</p>
                  <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 10px", lineHeight: 1.5 }}>{c.bio}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="subtle" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setSelected(c)}>Message</Btn>
                    <Btn variant="ghost" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setBooking(c)}>Book a session</Btn>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {myBookings.length > 0 && (
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: C.inkFaint, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.3 }}>My booking requests</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myBookings.map((b) => (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0 }}>{COUNSELORS.find((c) => c.id === b.counselorId)?.name || b.counselorId}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p style={{ fontSize: 12, color: C.inkFaint, margin: 0 }}>Requested: {b.preferredWhen}</p>
                {b.status === "Confirmed" && <p style={{ fontSize: 12.5, color: C.primaryDark, fontWeight: 700, margin: "6px 0 0" }}>Confirmed for: {b.confirmedAt}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Maps of USI ---------------------------------- */
function CampusMap() {
  return (
    <div style={{ padding: 16 }}>
      <Card style={{ padding: 8 }}>
        <img src={MAP_IMG} alt="Map of Universidad de Sta. Isabel de Naga Inc." style={{ width: "100%", display: "block", borderRadius: 10 }} />
      </Card>
      <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 10, lineHeight: 1.6, textAlign: "center" }}>
        This is the Universidad de Sta. Isabel de Naga Inc.
      </p>
    </div>
  );
}

/* ---------------------------------- About / Profile ---------------------------------- */
function About() {
  const items = [
    { label: "What ARISE does", text: "Lets students report bullying and safety concerns, request urgent help through SOS, message a guidance counselor directly, and get general emotional support from Aira — all in one private place." },
    { label: "Why it exists", text: "Many students stay quiet because reporting feels slow, public, or intimidating. ARISE makes speaking up fast, private, and easy to follow up on." },
    { label: "Your privacy", text: "Reports are only visible to authorized guidance staff handling your case. You choose whether to stay anonymous." },
  ];
  return (
    <div style={{ padding: "26px 22px", textAlign: "center" }}>
      <img src={LOGO_IMG} alt="ARISE logo, supported by ACE and Phoenix Publishing" style={{ width: 132, height: "auto", margin: "0 auto 14px" }} />
      <div style={{ ...serif, fontSize: 24, color: C.primary, marginBottom: 4, fontWeight: 700 }}>A.R.I.S.E.</div>
      <p style={{ fontSize: 11.5, color: C.inkFaint, marginBottom: 4, letterSpacing: 0.4 }}>ACTIVE RESPONSE INCIDENT SUPPORT AND EMPOWERMENT</p>
      <p style={{ fontSize: 11.5, color: C.goldDark, fontWeight: 700, marginBottom: 22 }}>Supported by ACE · Phoenix Publishing</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", maxWidth: 360, margin: "0 auto 20px" }}>
        {items.map((it) => (
          <Card key={it.label}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 0.3, margin: "0 0 6px" }}>{it.label}</p>
            <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>{it.text}</p>
          </Card>
        ))}
      </div>

      <p style={{ ...serif, fontSize: 16, color: C.ink, fontStyle: "italic", marginBottom: 18 }}>Built by students, for students.</p>

      <div style={{ fontSize: 11.5, color: C.inkFaint, lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>Version 1.0 · Prototype</p>
        <p style={{ margin: 0 }}>September 2026</p>
        <p style={{ margin: 0 }}>Developed by Terence Matthew Teodoro</p>
      </div>
    </div>
  );
}

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "College – 1st Year", "College – 2nd Year", "College – 3rd Year", "College – 4th Year", "Other"];
const GENDER_OPTIONS = ["Female", "Male", "Prefer not to say", "Other"];

function Profile({ onOpenAbout, onOpenNotifications, onSignOut, me, onSave }) {
  const initial = (me?.name || "U").trim().charAt(0).toUpperCase() || "U";
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(me?.username || "");
  const [gradeLevel, setGradeLevel] = useState(me?.gradeLevel || "");
  const [gender, setGender] = useState(me?.gender || "");
  const [photoURL, setPhotoURL] = useState(me?.photoURL || "");
  const [photoBusy, setPhotoBusy] = useState(false);

  function save() {
    onSave({ username, gradeLevel, gender, photoURL });
    setEditing(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <label style={{ width: 56, height: 56, borderRadius: "50%", background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.primaryDark, fontWeight: 700, fontSize: 18, overflow: "hidden", cursor: editing ? "pointer" : "default", flexShrink: 0 }}>
          {photoBusy ? "…" : photoURL ? <img src={photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
          {editing && <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPhotoBusy(true);
            const { dataUrl } = await fileToCompressedDataURL(file, 240, 0.75);
            if (dataUrl) setPhotoURL(dataUrl);
            setPhotoBusy(false);
          }} />}
        </label>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 2px" }}>{me?.username || me?.name || "User"}</p>
          <p style={{ fontSize: 12.5, color: C.inkFaint, margin: 0 }}>{me?.email || ""}</p>
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div><FieldLabel>Username</FieldLabel><input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} /></div>
          <div>
            <FieldLabel>Grade level</FieldLabel>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Gender</FieldLabel>
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
            <Btn full onClick={save}>Save profile</Btn>
          </div>
        </div>
      ) : (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>Profile settings</p>
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Edit</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: C.inkSoft }}>
            <p style={{ margin: 0 }}>Grade level: {me?.gradeLevel || "Not set"}</p>
            <p style={{ margin: 0 }}>Gender: {me?.gender || "Not set"}</p>
          </div>
        </Card>
      )}

      {[
        { icon: Bell, label: "Notifications", onClick: onOpenNotifications },
        { icon: Info, label: "About ARISE", onClick: onOpenAbout },
        { icon: LogOut, label: "Sign out", onClick: onSignOut },
      ].map((r) => (
        <button key={r.label} onClick={r.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 4px", border: "none", borderBottom: `1px solid ${C.line}`, background: "none", cursor: "pointer", textAlign: "left", fontSize: 14, color: C.ink }}>
          <r.icon size={17} color={C.inkSoft} /> {r.label}
        </button>
      ))}
    </div>
  );
}

function NotificationsView({ shared, me }) {
  const items = [];
  (shared.announcements || []).forEach((a) => {
    if (!a.title) return;
    items.push({ icon: Bell, title: a.title, sub: a.body, ts: a.ts, color: C.gold });
  });
  (shared.bookings || []).filter((b) => b.studentUid === me.uid && b.status !== "Pending").forEach((b) => {
    items.push({ icon: Clock, title: `Booking ${b.status.toLowerCase()}`, sub: b.status === "Confirmed" ? `Confirmed for ${b.confirmedAt}` : "Your counselor declined this request", ts: b.createdAt, color: C.primary });
  });
  Object.entries(shared.threads || {}).forEach(([cid, msgs]) => {
    const lastFromCounselor = [...msgs].reverse().find((m) => m.from === "counselor");
    if (lastFromCounselor) {
      const cName = COUNSELORS.find((c) => c.id === cid)?.name || "Counselor";
      items.push({ icon: MessageSquare, title: `New reply from ${cName}`, sub: lastFromCounselor.text, ts: lastFromCounselor.ts, color: C.primary });
    }
  });
  items.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <div style={{ padding: 16 }}>
      {items.length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", padding: 30 }}>Nothing new right now.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.slice(0, 20).map((it, i) => (
          <Card key={i}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${it.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <it.icon size={15} color={it.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{it.title}</p>
                <p style={{ fontSize: 12, color: C.inkFaint, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Student Home ---------------------------------- */
function VoiceCommandSheet({ onClose, onCommand }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);

  const commands = [
    { phrase: "Open SOS", to: "sos" }, { phrase: "Report an incident", to: "report" },
    { phrase: "Get support", to: "aira" }, { phrase: "Talk to a counselor", to: "voiceout" },
    { phrase: "Open my reports", to: "reports" },
  ];

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    try {
      const rec = new SR();
      recRef.current = rec;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setHeard(text);
        const hit = commands.find((c) => text.toLowerCase().includes(c.phrase.toLowerCase().split(" ")[0]));
        if (hit) onCommand(hit.to);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
      setListening(true);
    } catch (e) { setSupported(false); }
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(30,42,50,.45)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ background: "#fff", width: "100%", borderRadius: "18px 18px 0 0", padding: 22, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ ...serif, fontSize: 17, margin: 0 }}>Voice commands</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {supported ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <button onClick={start} style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: listening ? C.sos : C.primary, color: "#fff", cursor: "pointer" }}>
                <Mic size={26} />
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12.5, color: C.inkFaint, marginBottom: 14 }}>{listening ? "Listening…" : heard ? `Heard: "${heard}"` : "Tap the mic and say a command"}</p>
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 14 }}>Voice recognition isn't available in this browser. Use the buttons below instead.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {commands.map((c) => (
            <button key={c.phrase} onClick={() => onCommand(c.to)} style={{ textAlign: "left", padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 13.5 }}>"{c.phrase}"</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentHome({ go, sosActive, me, announcements, todayMood, onSetMood }) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const firstName = (me?.name || "").trim().split(" ")[0];
  const initial = (me?.name || "U").trim().charAt(0).toUpperCase() || "U";
  const latestAnnouncement = (announcements || [])[0];
  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_IMG} alt="ARISE logo" style={{ width: 38, height: 38, objectFit: "contain" }} />
          <div>
            <p style={{ ...serif, fontSize: 19, color: C.primary, margin: 0, fontWeight: 700 }}>A.R.I.S.E.</p>
            <p style={{ fontSize: 11.5, color: C.inkFaint, margin: "1px 0 0" }}>{firstName ? `Good to see you, ${firstName}.` : "Good to see you."}</p>
          </div>
        </div>
        <button onClick={() => go("profile")} style={{ width: 38, height: 38, borderRadius: "50%", background: C.primarySoft, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.primaryDark, fontWeight: 700, fontSize: 13, overflow: "hidden" }}>
          {me?.photoURL ? <img src={me.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
        </button>
      </div>

      {latestAnnouncement && (
        <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10 }}>
          <Bell size={16} color={C.goldDark} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: C.ink }}>{latestAnnouncement.title}</p>
            <p style={{ fontSize: 12.5, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>{latestAnnouncement.body}</p>
          </div>
        </div>
      )}

      <button onClick={() => go("sos")} style={{ width: "100%", border: "none", cursor: "pointer", borderRadius: 18, padding: "22px 18px", background: C.sos, color: "#fff", textAlign: "left", display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Siren size={22} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 2px" }}>Need help right now?</p>
          <p style={{ fontSize: 12.5, margin: 0, opacity: 0.9 }}>Press SOS to request immediate assistance.</p>
        </div>
      </button>
      {sosActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sos, fontWeight: 700, marginBottom: 18 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.sos }} /> Your SOS request is active — tap to view status
        </div>
      )}
      {!sosActive && <div style={{ marginBottom: 14 }} />}

      <Card style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>{todayMood ? "Thanks for checking in today" : "How are you feeling today?"}</p>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {MOOD_OPTIONS.map((m) => (
            <button key={m.id} onClick={() => onSetMood(m.id)} title={m.label} style={{ background: todayMood === m.id ? C.primarySoft : "none", border: "none", borderRadius: 10, padding: "6px 8px", cursor: "pointer", fontSize: 24, opacity: todayMood && todayMood !== m.id ? 0.4 : 1 }}>
              {m.emoji}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.inkFaint, margin: "8px 0 0" }}>Only you and your counselor can see this over time.</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[
          { icon: FileText, label: "Report a concern", to: "report", accent: C.gold, bg: C.goldSoft },
          { icon: Users, label: "Talk to a counselor", to: "voiceout", accent: C.primary, bg: C.primarySoft },
          { icon: MessageCircle, label: "AI support", to: "aira", accent: C.primary, bg: C.primarySoft },
          { icon: ClipboardList, label: "My reports", to: "reports", accent: C.gold, bg: C.goldSoft },
        ].map((a) => (
          <button key={a.label} onClick={() => go(a.to)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <a.icon size={17} color={a.accent} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{a.label}</p>
          </button>
        ))}
      </div>

      <button onClick={() => setVoiceOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 14px", background: "#fff", cursor: "pointer", fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>
        <Mic size={14} /> Voice commands
      </button>
      {voiceOpen && <VoiceCommandSheet onClose={() => setVoiceOpen(false)} onCommand={(to) => { setVoiceOpen(false); go(to); }} />}
    </div>
  );
}

/* ---------------------------------- Student root ---------------------------------- */
function PeerChatView({ me, otherUser, thread, onSend, onBack, onOpen }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);
  useEffect(() => { onOpen?.(); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ArrowLeft size={18} /></button>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.goldDark, fontWeight: 700, fontSize: 12, overflow: "hidden" }}>
          {otherUser.photoURL ? <img src={otherUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (otherUser.name || "?").charAt(0).toUpperCase()}
        </div>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{otherUser.name}</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {(thread || []).length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", marginTop: 30 }}>Say hi to {otherUser.name}!</p>}
        {(thread || []).map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.senderUid === me.uid ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{ background: m.senderUid === me.uid ? C.gold : "#fff", color: m.senderUid === me.uid ? "#fff" : C.ink, border: m.senderUid === me.uid ? "none" : `1px solid ${C.line}`, borderRadius: 14, padding: "10px 13px", fontSize: 14 }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.line}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { onSend(input); setInput(""); } }} placeholder="Message…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => { if (input.trim()) { onSend(input); setInput(""); } }} style={{ background: C.gold, border: "none", borderRadius: 10, width: 42, color: "#fff", cursor: "pointer" }}><Send size={17} /></button>
      </div>
    </div>
  );
}

function FriendsChat({ me, allStudents, peerMessagesByThread, onAddFriend, onSendPeer, onMarkPeerRead }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("friends");
  const friends = allStudents.filter((s) => (me.friends || []).includes(s.uid));
  const others = allStudents.filter((s) => s.uid !== me.uid && !(me.friends || []).includes(s.uid));

  if (selected) {
    const threadId = [me.uid, selected.uid].sort().join("__");
    return <PeerChatView me={me} otherUser={selected} thread={peerMessagesByThread[threadId]} onSend={(t) => onSendPeer(selected.uid, t)} onBack={() => setSelected(null)} onOpen={() => onMarkPeerRead(threadId)} />;
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setTab("friends")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${tab === "friends" ? C.gold : C.line}`, background: tab === "friends" ? C.goldSoft : "#fff", color: tab === "friends" ? C.goldDark : C.inkSoft }}>Friends</button>
        <button onClick={() => setTab("find")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${tab === "find" ? C.gold : C.line}`, background: tab === "find" ? C.goldSoft : "#fff", color: tab === "find" ? C.goldDark : C.inkSoft }}>Find people</button>
      </div>

      {tab === "friends" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {friends.length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", padding: 24 }}>No friends added yet — check "Find people" to add someone.</p>}
          {friends.map((f) => {
            const threadId = [me.uid, f.uid].sort().join("__");
            const msgs = peerMessagesByThread[threadId] || [];
            const unread = msgs.filter((m) => m.senderUid !== me.uid && !m.read).length;
            const last = msgs[msgs.length - 1];
            return (
              <Card key={f.uid} onClick={() => setSelected(f)}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.goldDark, fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: "hidden" }}>
                    {f.photoURL ? <img src={f.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (f.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{f.name}</p>
                    <p style={{ fontSize: 12, color: C.inkFaint, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last?.text || "No messages yet"}</p>
                  </div>
                  {unread > 0 && <span style={{ background: C.sos, color: "#fff", fontSize: 10.5, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{unread}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "find" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {others.length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", padding: 24 }}>No other students found yet.</p>}
          {others.map((s) => (
            <Card key={s.uid}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.goldDark, fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: "hidden" }}>
                  {s.photoURL ? <img src={s.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (s.name || "?").charAt(0).toUpperCase()}
                </div>
                <p style={{ flex: 1, fontWeight: 700, fontSize: 13.5, margin: 0 }}>{s.name}</p>
                <Btn variant="subtle" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onAddFriend(s.uid)}>Add</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentApp({ shared, actions, me, onSignOut, voiceOutUnread, chatUnread }) {
  const [view, setView] = useState("home");
  const [openReport, setOpenReport] = useState(null);
  const [draftReport, setDraftReport] = useState(null);

  const nav = [
    { id: "home", icon: Home, label: "Home" },
    { id: "aira", icon: MessageCircle, label: "Aira" },
    { id: "voiceout", icon: Users, label: "Voice Out", badge: voiceOutUnread },
    { id: "chat", icon: MessageSquare, label: "Chat", badge: chatUnread },
    { id: "maps", icon: MapIcon, label: "Maps" },
    { id: "about", icon: Info, label: "About" },
  ];

  const myReports = shared.reports.filter((r) => r.ownerUid === me.uid);
  const activeSos = shared.sosRequests.find((s) => s.ownerUid === me.uid && s.status !== "Resolved");
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMood = (shared.moods || []).find((m) => m.studentUid === me.uid && m.date === todayKey)?.mood || null;

  let body, title = null, onBack = null;
  if (view === "home") body = <StudentHome go={setView} sosActive={!!activeSos} me={me} announcements={shared.announcements} todayMood={todayMood} onSetMood={actions.setMood} />;
  else if (view === "sos") { title = "Emergency SOS"; onBack = () => setView("home"); body = <SosFlow activeRequest={activeSos} onBack={() => setView("home")} onCreate={() => actions.createSos()} onOpenDepartments={() => setView("emergencyDepts")} />; }
  else if (view === "emergencyDepts") { title = "Emergency contacts"; onBack = () => setView("sos"); body = <EmergencyDepartments />; }
  else if (view === "report") { title = "Report a concern"; onBack = () => setView("home"); body = <ReportIncident categories={shared.categories} onCancel={() => setView("home")} onNeedsSos={() => setView("sos")} onSubmit={(f) => { const r = actions.submitReport(f); setDraftReport(r); setView("reportDone"); }} />; }
  else if (view === "reportDone") { body = <ReportConfirmation report={draftReport} onDone={() => setView("home")} />; }
  else if (view === "reports") { title = "My reports"; onBack = () => setView("home"); body = <MyReports reports={myReports} onOpen={(r) => { setOpenReport(r); setView("reportDetail"); }} />; }
  else if (view === "reportDetail") { title = openReport.id; onBack = () => setView("reports"); body = <ReportTimeline report={openReport} />; }
  else if (view === "aira") { title = "Aira · AI support"; onBack = () => setView("home"); body = <AiraChat />; }
  else if (view === "voiceout") { title = "Talk to a counselor"; onBack = () => setView("home"); body = <VoiceOut threads={shared.threads} onSend={actions.sendToCounselor} onMarkRead={(cid) => actions.markThreadRead(`${me.uid}_${cid}`, "counselor")} bookings={shared.bookings} me={me} onRequestBooking={actions.requestBooking} />; }
  else if (view === "chat") { title = "Chat"; onBack = () => setView("home"); body = <FriendsChat me={me} allStudents={shared.allStudents} peerMessagesByThread={shared.peerMessagesByThread} onAddFriend={actions.addFriend} onSendPeer={actions.sendPeerMessage} onMarkPeerRead={actions.markPeerThreadRead} />; }
  else if (view === "maps") { title = "Maps of USI"; onBack = () => setView("home"); body = <CampusMap />; }
  else if (view === "about") { title = "About ARISE"; onBack = () => setView("home"); body = <About />; }
  else if (view === "profile") { title = "Profile settings"; onBack = () => setView("home"); body = <Profile onOpenAbout={() => setView("about")} onOpenNotifications={() => setView("notifications")} onSignOut={onSignOut} me={me} onSave={actions.updateMyProfile} />; }
  else if (view === "notifications") { title = "Notifications"; onBack = () => setView("profile"); body = <NotificationsView shared={shared} me={me} />; }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 61px)" }}>
      <div className="content-col" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {title && <TopBar title={title} onBack={onBack} />}
        <div style={{ flex: 1, position: "relative" }}>{body}</div>
      </div>
      <div className="student-nav" style={{ background: "#fff" }}>
        <div className="content-col" style={{ display: "flex", width: "100%" }}>
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", padding: "9px 0 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: view === n.id || (view === "sos" && n.id === "home") ? C.primary : C.inkFaint, position: "relative" }}>
              <span style={{ position: "relative" }}>
                <n.icon size={19} />
                {!!n.badge && <span style={{ position: "absolute", top: -4, right: -7, background: C.sos, color: "#fff", fontSize: 9.5, fontWeight: 700, borderRadius: 999, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{n.badge}</span>}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: view === n.id ? 700 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Counselor dashboard ---------------------------------- */
function CounselorOverview({ shared }) {
  const stats = [
    { label: "Active cases", val: shared.reports.filter((r) => !["Resolved", "Closed"].includes(r.status)).length },
    { label: "New reports", val: shared.reports.filter((r) => r.status === "Submitted").length },
    { label: "SOS requests", val: shared.sosRequests.filter((s) => s.status !== "Resolved").length },
    { label: "Resolved", val: shared.reports.filter((r) => r.status === "Resolved").length },
  ];
  const moodByStudent = {};
  (shared.moods || []).forEach((m) => {
    (moodByStudent[m.studentName] ||= []).push(m);
  });
  Object.values(moodByStudent).forEach((arr) => arr.sort((a, b) => (a.date > b.date ? 1 : -1)));
  const moodStudents = Object.keys(moodByStudent).slice(0, 6);
  return (
    <div style={{ padding: 18 }}>
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        {stats.map((s) => (
          <Card key={s.label}><p style={{ fontSize: 11.5, color: C.inkFaint, margin: "0 0 4px" }}>{s.label}</p><p style={{ ...serif, fontSize: 26, margin: 0, color: C.ink }}>{s.val}</p></Card>
        ))}
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.3, margin: "0 0 8px" }}>Recent reports</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: moodStudents.length ? 22 : 0 }}>
        {shared.reports.slice(0, 4).map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{r.category}</p><p style={{ fontSize: 11.5, color: C.inkFaint, margin: 0 }}>{r.id} · {r.anonymous ? "Anonymous" : "Named"}</p></div>
              <StatusBadge status={r.status} />
            </div>
          </Card>
        ))}
      </div>
      {moodStudents.length > 0 && (
        <>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.3, margin: "0 0 8px" }}>Recent mood check-ins</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moodStudents.map((name) => {
              const entries = moodByStudent[name].slice(-7);
              return (
                <Card key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0 }}>{name}</p>
                    <div style={{ display: "flex", gap: 4 }}>
                      {entries.map((e, i) => (
                        <span key={i} title={`${e.date} · ${e.mood}`} style={{ fontSize: 16 }}>{MOOD_OPTIONS.find((m) => m.id === e.mood)?.emoji || "•"}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CounselorReports({ shared, actions }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState("");

  const filtered = shared.reports.filter((r) =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (r.id.toLowerCase().includes(q.toLowerCase()) || r.category.toLowerCase().includes(q.toLowerCase()))
  );

  if (open) {
    return (
      <div style={{ padding: 18 }}>
        <button onClick={() => setOpen(null)} style={{ background: "none", border: "none", color: C.inkFaint, display: "flex", gap: 4, alignItems: "center", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 14 }}><ArrowLeft size={14} /> All reports</button>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{open.id}</p>
            <StatusBadge status={open.status} />
          </div>
          <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 10px" }}>{open.category} · {open.when} · {open.where} · {open.anonymous ? "Anonymous" : "Named"}</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "0 0 8px" }}>{open.what}</p>
          {open.who && <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 4px" }}>Involved: {open.who}</p>}
          {open.witnesses && <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 4px" }}>Witnesses: {open.witnesses}</p>}
          <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 4px" }}>Frequency: {open.frequency}</p>
          <p style={{ fontSize: 12.5, color: C.inkSoft, margin: 0 }}>Student says they feel: {open.feelings}</p>
          {open.attachmentData && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: C.inkFaint, margin: "0 0 6px", textTransform: "uppercase" }}>Attached photo</p>
              <img src={open.attachmentData} alt="Report attachment" style={{ maxWidth: "100%", borderRadius: 8, border: `1px solid ${C.line}`, display: "block" }} />
            </div>
          )}
        </Card>

        <FieldLabel>Update status</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {STATUS_FLOW.map((s) => (
            <button key={s} onClick={() => { actions.updateReportStatus(open.id, s); setOpen({ ...open, status: s }); }} style={{ padding: "7px 11px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: `1.5px solid ${open.status === s ? C.primary : C.line}`, background: open.status === s ? C.primarySoft : "#fff", color: open.status === s ? C.primaryDark : C.ink }}>{s}</button>
          ))}
        </div>

        <FieldLabel>Private case notes</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {(open.notes || []).map((n, i) => <div key={i} style={{ fontSize: 12.5, background: C.bg, borderRadius: 8, padding: "8px 10px" }}>{n}</div>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a follow-up note…" style={{ ...inputStyle, flex: 1 }} />
          <Btn variant="subtle" onClick={() => { if (note.trim()) { actions.addNote(open.id, note); setOpen({ ...open, notes: [...(open.notes || []), note] }); setNote(""); } }}>Add</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: C.inkFaint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search case ID or category" style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        {["All", ...STATUS_FLOW].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: `1.5px solid ${statusFilter === s ? C.primary : C.line}`, background: statusFilter === s ? C.primarySoft : "#fff", color: statusFilter === s ? C.primaryDark : C.inkSoft }}>{s}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((r) => (
          <Card key={r.id} onClick={() => setOpen(r)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{r.category}</p><p style={{ fontSize: 11.5, color: C.inkFaint, margin: 0 }}>{r.id} · {r.when}</p></div>
              <StatusBadge status={r.status} />
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint, textAlign: "center", padding: 20 }}>No reports match.</p>}
      </div>
    </div>
  );
}

function CounselorSos({ shared, actions, me }) {
  return (
    <div style={{ padding: 18 }}>
      {shared.sosRequests.length === 0 && <p style={{ fontSize: 13, color: C.inkFaint, textAlign: "center", padding: 30 }}>No SOS requests.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shared.sosRequests.map((s) => (
          <Card key={s.id} style={{ borderColor: s.status === "Active" ? C.sos : C.line, borderWidth: s.status === "Active" ? 2 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0 }}>{s.id}</p>
              <StatusBadge status={s.status} />
            </div>
            <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 2px" }}>Received {fmtTime(s.timestamp)}</p>
            <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 10px" }}>Student: {s.studentAlias}</p>
            {s.status === "Active" && <Btn variant="sos" onClick={() => actions.updateSos(s.id, "Responding", me?.name || "Counselor")}>Respond now</Btn>}
            {s.status === "Responding" && (
              <>
                <p style={{ fontSize: 12, color: C.primaryDark, margin: "0 0 8px" }}>{s.assignedResponder} is responding.</p>
                <Btn variant="subtle" onClick={() => actions.updateSos(s.id, "Resolved", s.assignedResponder)}>Mark resolved</Btn>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CounselorMessages({ shared, actions }) {
  const [selected, setSelected] = useState(null);
  const casesWithThreads = Object.keys(shared.threads).filter((k) => shared.threads[k].length > 0);
  if (selected) {
    return <CounselorChat counselor={{ name: shared.threadsMeta?.[selected]?.studentName || "Student" }} thread={(shared.threads[selected] || []).map((m) => ({ from: m.from === "student" ? "assistant" : "student", text: m.text }))} onSend={(t) => actions.sendToStudent(selected, t)} onBack={() => setSelected(null)} onOpen={() => actions.markThreadRead(selected, "counselor")} />;
  }
  return (
    <div style={{ padding: 18 }}>
      {casesWithThreads.length === 0 && <p style={{ fontSize: 13, color: C.inkFaint, textAlign: "center", padding: 30 }}>No conversations yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {casesWithThreads.map((k) => {
          const last = shared.threads[k][shared.threads[k].length - 1];
          const cName = shared.threadsMeta?.[k]?.studentName || "Student";
          const unread = shared.threads[k].filter((m) => m.from === "student" && !m.read).length;
          return (
            <Card key={k} onClick={() => setSelected(k)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 3px" }}>{cName}</p>
                {unread > 0 && <span style={{ background: C.sos, color: "#fff", fontSize: 10.5, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{unread}</span>}
              </div>
              <p style={{ fontSize: 12.5, color: C.inkFaint, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last?.text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RoleNav({ tabs, active, onSelect }) {
  return (
    <>
      <div className="role-tabbar" style={{ borderBottom: `1px solid ${C.line}`, background: "#fff", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{ flex: "0 0 auto", minWidth: 74, border: "none", background: "none", cursor: "pointer", padding: "11px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderBottom: `2px solid ${active === t.id ? C.primary : "transparent"}`, color: active === t.id ? C.primary : C.inkFaint }}>
            <t.icon size={16} /> <span style={{ fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="role-sidebar">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{ border: "none", background: active === t.id ? C.primarySoft : "none", color: active === t.id ? C.primaryDark : C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13.5, fontWeight: active === t.id ? 700 : 500, textAlign: "left" }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
    </>
  );
}

function CounselorBookings({ shared, actions }) {
  const [timeDrafts, setTimeDrafts] = useState({});
  const bookings = shared.bookings || [];
  return (
    <div style={{ padding: 18 }}>
      {bookings.length === 0 && <p style={{ fontSize: 13, color: C.inkFaint, textAlign: "center", padding: 30 }}>No booking requests yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bookings.map((b) => (
          <Card key={b.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontWeight: 700, fontSize: 13.5, margin: 0 }}>{b.studentName}</p>
              <StatusBadge status={b.status} />
            </div>
            <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 2px" }}>With {COUNSELORS.find((c) => c.id === b.counselorId)?.name || b.counselorId}</p>
            <p style={{ fontSize: 12, color: C.inkFaint, margin: "0 0 4px" }}>Preferred: {b.preferredWhen}</p>
            {b.note && <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 10px" }}>"{b.note}"</p>}
            {b.status === "Pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={timeDrafts[b.id] || ""} onChange={(e) => setTimeDrafts((d) => ({ ...d, [b.id]: e.target.value }))} placeholder="e.g. Fri, Sept 12, 2:00 PM" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                <Btn variant="subtle" style={{ padding: "8px 12px", fontSize: 12.5 }} disabled={!timeDrafts[b.id]?.trim()} onClick={() => actions.confirmBooking(b.id, timeDrafts[b.id])}>Confirm</Btn>
                <Btn variant="danger" style={{ padding: "8px 12px", fontSize: 12.5 }} onClick={() => actions.declineBooking(b.id)}>Decline</Btn>
              </div>
            )}
            {b.status === "Confirmed" && <p style={{ fontSize: 12.5, color: C.primaryDark, fontWeight: 700, margin: 0 }}>Confirmed for: {b.confirmedAt}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CounselorApp({ shared, actions, me }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "sos", label: "SOS", icon: Siren },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "bookings", label: "Bookings", icon: Clock },
  ];
  return (
    <div className="dashboard-shell">
      <RoleNav tabs={tabs} active={tab} onSelect={setTab} />
      <div className="dashboard-main">
        <div className="wide-panel">
          {tab === "overview" && <CounselorOverview shared={shared} />}
          {tab === "reports" && <CounselorReports shared={shared} actions={actions} />}
          {tab === "sos" && <CounselorSos shared={shared} actions={actions} me={me} />}
          {tab === "messages" && <CounselorMessages shared={shared} actions={actions} />}
          {tab === "bookings" && <CounselorBookings shared={shared} actions={actions} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Admin dashboard ---------------------------------- */
function AdminOverview({ shared }) {
  const byCat = shared.categories.map((c) => ({ name: c.length > 10 ? c.slice(0, 9) + "…" : c, count: shared.reports.filter((r) => r.category === c).length }));
  const stats = [
    { label: "Registered students", val: 486 },
    { label: "Total incidents", val: shared.reports.length },
    { label: "Active cases", val: shared.reports.filter((r) => !["Resolved", "Closed"].includes(r.status)).length },
    { label: "SOS requests", val: shared.sosRequests.length },
  ];
  return (
    <div style={{ padding: 18 }}>
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        {stats.map((s) => <Card key={s.label}><p style={{ fontSize: 11.5, color: C.inkFaint, margin: "0 0 4px" }}>{s.label}</p><p style={{ ...serif, fontSize: 24, margin: 0 }}>{s.val}</p></Card>)}
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 8px" }}>Reports by category</p>
      <Card style={{ height: 240, marginBottom: 10 }}>
        <Suspense fallback={<div style={{ height: "100%" }} />}>
          <CategoryChart data={byCat} primaryColor={C.primary} lineColor={C.line} inkFaintColor={C.inkFaint} />
        </Suspense>
      </Card>
    </div>
  );
}

function AdminUsers() {
  const [counselors, setCounselors] = useState(COUNSELORS.map((c) => ({ ...c, active: true })));
  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 10px" }}>Counselor accounts</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {counselors.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{c.name}</p><p style={{ fontSize: 11.5, color: C.inkFaint, margin: 0 }}>{c.role}</p></div>
              <Btn variant={c.active ? "subtle" : "ghost"} onClick={() => setCounselors(counselors.map((x) => x.id === c.id ? { ...x, active: !x.active } : x))} style={{ padding: "6px 12px", fontSize: 11.5 }}>{c.active ? "Active" : "Deactivated"}</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminCategories({ shared, actions }) {
  const [nc, setNc] = useState("");
  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 10px" }}>Report categories</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {shared.categories.map((c) => (
          <span key={c} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: C.primarySoft, color: C.primaryDark, fontSize: 12.5 }}>
            {c} <button onClick={() => actions.removeCategory(c)} style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryDark, display: "flex" }}><X size={12} /></button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={nc} onChange={(e) => setNc(e.target.value)} placeholder="New category" style={{ ...inputStyle, flex: 1 }} />
        <Btn variant="subtle" onClick={() => { if (nc.trim()) { actions.addCategory(nc.trim()); setNc(""); } }}><Plus size={15} /></Btn>
      </div>
    </div>
  );
}

function AdminSosConfig() {
  const [responders, setResponders] = useState([{ name: "Ms. Baby Villafuerte", role: "Guidance", on: true }, { name: "Ms. Alice Celebrado", role: "Guidance", on: true }, { name: "Ms. Louis Roldan", role: "School Nurse", on: true }, { name: "Security Office", role: "Security", on: false }]);
  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 10px" }}>Designated SOS responders</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {responders.map((r, i) => (
          <Card key={r.name}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{r.name}</p><p style={{ fontSize: 11.5, color: C.inkFaint, margin: 0 }}>{r.role}</p></div>
              <button onClick={() => setResponders(responders.map((x, idx) => idx === i ? { ...x, on: !x.on } : x))} style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: r.on ? C.primary : C.line, position: "relative" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: r.on ? 21 : 3, transition: "left .15s" }} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminAudit({ shared }) {
  return (
    <div style={{ padding: 18 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 10px" }}>Audit log</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {shared.auditLog.length === 0 && <p style={{ fontSize: 12.5, color: C.inkFaint }}>No activity yet.</p>}
        {shared.auditLog.slice().reverse().map((a) => (
          <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
            <ScrollText size={14} color={C.inkFaint} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12.5, margin: 0 }}>{a.action}</p>
              <p style={{ fontSize: 11, color: C.inkFaint, margin: "1px 0 0" }}>{a.actor} · {fmtTime(a.ts)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnnouncements({ shared, actions, me }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div style={{ padding: 18 }}>
      <Card style={{ marginBottom: 18 }}>
        <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>Post a school-wide announcement</p>
        <FieldLabel>Title</FieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Anti-Bullying Awareness Week" style={{ ...inputStyle, marginBottom: 12 }} />
        <FieldLabel>Message</FieldLabel>
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }} />
        <Btn disabled={!title.trim() || !body.trim()} onClick={() => { actions.postAnnouncement(title.trim(), body.trim()); setTitle(""); setBody(""); }}>Post to all students</Btn>
      </Card>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: C.inkFaint, textTransform: "uppercase", margin: "0 0 10px" }}>Posted announcements</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(shared.announcements || []).filter((a) => a.title).map((a) => (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13.5, margin: "0 0 2px" }}>{a.title}</p>
                <p style={{ fontSize: 12.5, color: C.inkSoft, margin: "0 0 4px", lineHeight: 1.5 }}>{a.body}</p>
                <p style={{ fontSize: 11, color: C.inkFaint, margin: 0 }}>{fmtTime(a.ts)}</p>
              </div>
              <button onClick={() => actions.deleteAnnouncement(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint }}><Trash2 size={15} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminApp({ shared, actions, me }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: UserCog },
    { id: "categories", label: "Categories", icon: Filter },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "sosConfig", label: "SOS setup", icon: Siren },
    { id: "audit", label: "Audit log", icon: ScrollText },
  ];
  return (
    <div className="dashboard-shell">
      <RoleNav tabs={tabs} active={tab} onSelect={setTab} />
      <div className="dashboard-main">
        <div className="wide-panel">
          {tab === "overview" && <AdminOverview shared={shared} />}
          {tab === "users" && <AdminUsers />}
          {tab === "categories" && <AdminCategories shared={shared} actions={actions} />}
          {tab === "announcements" && <AdminAnnouncements shared={shared} actions={actions} me={me} />}
          {tab === "sosConfig" && <AdminSosConfig />}
          {tab === "audit" && <AdminAudit shared={shared} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- role switcher ---------------------------------- */
function RoleSwitcher({ current, onSwitch }) {
  const [open, setOpen] = useState(false);
  const roles = [{ id: "student", label: "Student", icon: User }, { id: "counselor", label: "Counselor", icon: ShieldCheck }, { id: "admin", label: "Admin", icon: UserCog }];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: C.primarySoft, border: "none", borderRadius: 999, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", color: C.primaryDark, fontSize: 12, fontWeight: 700 }}>
        {roles.find((r) => r.id === current)?.label} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "115%", right: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.08)", zIndex: 30, minWidth: 140 }}>
          {roles.map((r) => (
            <button key={r.id} onClick={() => { onSwitch(r.id); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", border: "none", background: r.id === current ? C.primarySoft : "none", cursor: "pointer", fontSize: 13, color: C.ink, textAlign: "left" }}>
              <r.icon size={14} /> {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- App root ---------------------------------- */
export default function ArisePrototype() {
  const [onboarded, setOnboarded] = useState(false);
  const [roleMenuUnlocked, setRoleMenuUnlocked] = useState(false);
  const logoClicks = useRef({ count: 0, timer: null });
  const handleLogoClick = () => {
    const state = logoClicks.current;
    state.count += 1;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => { state.count = 0; }, 1500);
    if (state.count >= 5) {
      state.count = 0;
      setRoleMenuUnlocked((v) => !v);
    }
  };

  // ---- auth state ----
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { name, email, role }
  const [role, setRole] = useState("student");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) setProfile(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setRole(data.role || "student");
      } else {
        const fallback = { name: user.displayName || "User", email: user.email || "", role: "student" };
        await setDoc(doc(db, "users", user.uid), fallback);
        setProfile(fallback);
        setRole("student");
      }
    });
    return unsub;
  }, [user]);

  // ---- shared data (Firestore-backed) ----
  const [reports, setReports] = useState([]);
  const [sosRequests, setSosRequests] = useState([]);
  const [categories, setCategories] = useState(CATEGORY_DEFAULTS);
  const [auditLog, setAuditLog] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [threadsMeta, setThreadsMeta] = useState({});
  const [bookings, setBookings] = useState([]);
  const [moods, setMoods] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [peerMessagesByThread, setPeerMessagesByThread] = useState({});
  const [allStudents, setAllStudents] = useState([]);
  const [dbError, setDbError] = useState("");
  const onErr = (label) => (err) => setDbError(`${label}: ${err.code || ""} ${err.message}`);

  useEffect(() => {
    if (!user) return;
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      setReports(snap.docs.map((d) => d.data()));
    }, onErr("reports"));
    const unsubSos = onSnapshot(collection(db, "sosRequests"), (snap) => {
      setSosRequests(snap.docs.map((d) => d.data()));
    }, onErr("SOS requests"));
    const unsubAudit = onSnapshot(query(collection(db, "auditLog"), orderBy("ts")), (snap) => {
      setAuditLog(snap.docs.map((d) => d.data()));
    }, onErr("audit log"));
    const unsubCategories = onSnapshot(doc(db, "config", "categories"), (snap) => {
      if (snap.exists()) setCategories(snap.data().list);
      else setDoc(doc(db, "config", "categories"), { list: CATEGORY_DEFAULTS }).catch(onErr("categories"));
    }, onErr("categories"));
    const unsubMsgs = onSnapshot(collectionGroup(db, "messages"), (snap) => {
      const grouped = {};
      snap.forEach((d) => {
        const parent = d.ref.parent.parent;
        if (!parent || d.ref.parent.id !== "messages" || parent.parent?.id !== "threads") return;
        const threadId = parent.id;
        (grouped[threadId] ||= []).push({ ...d.data(), _id: d.id, _threadId: threadId });
      });
      Object.keys(grouped).forEach((k) => grouped[k].sort((a, b) => a.ts - b.ts));
      setMessagesByThread(grouped);
    }, onErr("messages"));
    const unsubThreads = onSnapshot(collection(db, "threads"), (snap) => {
      const meta = {};
      snap.forEach((d) => { meta[d.id] = d.data(); });
      setThreadsMeta(meta);
    }, onErr("threads"));
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(snap.docs.map((d) => d.data()));
    }, onErr("bookings"));
    const unsubMoods = onSnapshot(collection(db, "moods"), (snap) => {
      setMoods(snap.docs.map((d) => d.data()));
    }, onErr("moods"));
    const unsubAnnouncements = onSnapshot(query(collection(db, "announcements"), orderBy("ts", "desc")), (snap) => {
      setAnnouncements(snap.docs.map((d) => d.data()));
    }, onErr("announcements"));
    const unsubPeerMsgs = onSnapshot(collectionGroup(db, "peerMessages"), (snap) => {
      const grouped = {};
      snap.forEach((d) => {
        const parent = d.ref.parent.parent;
        if (!parent) return;
        const threadId = parent.id;
        (grouped[threadId] ||= []).push({ ...d.data(), _id: d.id });
      });
      Object.keys(grouped).forEach((k) => grouped[k].sort((a, b) => a.ts - b.ts));
      setPeerMessagesByThread(grouped);
    }, onErr("peer messages"));
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setAllStudents(snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => u.role === "student"));
    }, onErr("users"));
    return () => { unsubReports(); unsubSos(); unsubAudit(); unsubCategories(); unsubMsgs(); unsubThreads(); unsubBookings(); unsubMoods(); unsubAnnouncements(); unsubPeerMsgs(); unsubUsers(); };
  }, [user]);

  const me = user ? { uid: user.uid, name: profile?.name || user.displayName || "User", email: user.email || "", photoURL: profile?.photoURL || "", username: profile?.username || "", gradeLevel: profile?.gradeLevel || "", gender: profile?.gender || "", friends: profile?.friends || [] } : null;

  const log = (actor, action) => addDoc(collection(db, "auditLog"), { actor, action, ts: now() }).catch(onErr("audit log write"));

  const myThreads = {};
  COUNSELORS.forEach((c) => {
    const tid = user ? `${user.uid}_${c.id}` : null;
    myThreads[c.id] = (tid && messagesByThread[tid]) || [];
  });

  // unread counts
  let voiceOutUnread = 0;
  if (role === "student") {
    Object.values(myThreads).forEach((msgs) => { msgs.forEach((m) => { if (m.from === "counselor" && !m.read) voiceOutUnread++; }); });
  } else {
    Object.values(messagesByThread).forEach((msgs) => { msgs.forEach((m) => { if (m.from === "student" && !m.read) voiceOutUnread++; }); });
  }
  let chatUnread = 0;
  Object.entries(peerMessagesByThread).forEach(([threadId, msgs]) => {
    if (!user || !threadId.split("__").includes(user.uid)) return;
    msgs.forEach((m) => { if (m.senderUid !== user.uid && !m.read) chatUnread++; });
  });

  const shared = {
    reports, sosRequests, categories, auditLog, bookings, moods, announcements,
    threads: role === "student" ? myThreads : messagesByThread,
    threadsMeta, peerMessagesByThread, allStudents,
  };

  const actions = {
    submitReport: (f) => {
      const id = uid("ARS");
      const r = { id, ownerUid: user.uid, ownerName: me.name, ...f, status: "Submitted", assignedCounselor: null, notes: [], createdAt: now() };
      setDoc(doc(db, "reports", id), r).catch(onErr("submit report"));
      log(f.anonymous ? "Anonymous student" : me.name, `Submitted a ${f.category} report (${id})`);
      return r;
    },
    updateReportStatus: (id, status) => {
      const extra = status === "Assigned to Counselor" ? { assignedCounselor: me.name } : {};
      updateDoc(doc(db, "reports", id), { status, ...extra }).catch(onErr("update report"));
      log(me.name, `Updated ${id} to "${status}"`);
    },
    addNote: (id, note) => {
      updateDoc(doc(db, "reports", id), { notes: arrayUnion(note) }).catch(onErr("add note"));
      log(me.name, `Added a note to ${id}`);
    },
    createSos: () => {
      const id = uid("SOS");
      const s = { id, ownerUid: user.uid, studentAlias: me.name, timestamp: now(), status: "Active", assignedResponder: null };
      setDoc(doc(db, "sosRequests", id), s).catch(onErr("SOS"));
      log(me.name, `Triggered SOS (${id})`);
    },
    updateSos: (id, status, responder) => {
      updateDoc(doc(db, "sosRequests", id), { status, assignedResponder: responder }).catch(onErr("update SOS"));
      log(me.name, `${status === "Resolved" ? "Resolved" : "Responded to"} ${id}`);
    },
    sendToCounselor: async (counselorId, text) => {
      try {
        const threadId = `${user.uid}_${counselorId}`;
        await setDoc(doc(db, "threads", threadId), { studentUid: user.uid, studentName: me.name, counselorId, updatedAt: now(), lastMessage: text }, { merge: true });
        await addDoc(collection(db, "threads", threadId, "messages"), { from: "student", text, ts: now(), read: false });
      } catch (err) { onErr("send message")(err); }
    },
    sendToStudent: async (threadId, text) => {
      try {
        await updateDoc(doc(db, "threads", threadId), { updatedAt: now(), lastMessage: text });
        await addDoc(collection(db, "threads", threadId, "messages"), { from: "counselor", text, ts: now(), read: false });
      } catch (err) { onErr("send message")(err); }
    },
    markThreadRead: (threadId, notFrom) => {
      const msgs = messagesByThread[threadId] || [];
      msgs.filter((m) => m.from !== notFrom && !m.read).forEach((m) => {
        updateDoc(doc(db, "threads", threadId, "messages", m._id), { read: true }).catch(onErr("mark read"));
      });
    },
    addCategory: (c) => updateDoc(doc(db, "config", "categories"), { list: arrayUnion(c) }).catch(onErr("add category")),
    removeCategory: (c) => updateDoc(doc(db, "config", "categories"), { list: arrayRemove(c) }).catch(onErr("remove category")),
    requestBooking: (counselorId, note, preferredWhen) => {
      const id = uid("BK");
      setDoc(doc(db, "bookings", id), { id, studentUid: user.uid, studentName: me.name, counselorId, note, preferredWhen, status: "Pending", confirmedAt: "", createdAt: now() }).catch(onErr("request booking"));
      log(me.name, `Requested a booking with ${COUNSELORS.find((c) => c.id === counselorId)?.name || counselorId}`);
    },
    confirmBooking: (id, confirmedAt) => {
      updateDoc(doc(db, "bookings", id), { status: "Confirmed", confirmedAt }).catch(onErr("confirm booking"));
      log(me.name, `Confirmed booking ${id}`);
    },
    declineBooking: (id) => {
      updateDoc(doc(db, "bookings", id), { status: "Declined" }).catch(onErr("decline booking"));
      log(me.name, `Declined booking ${id}`);
    },
    setMood: (mood) => {
      const dayKey = new Date().toISOString().slice(0, 10);
      setDoc(doc(db, "moods", `${user.uid}_${dayKey}`), { studentUid: user.uid, studentName: me.name, mood, date: dayKey, ts: now() }).catch(onErr("save mood"));
    },
    postAnnouncement: (title, body) => {
      const id = uid("ANN");
      setDoc(doc(db, "announcements", id), { id, title, body, authorName: me.name, ts: now() }).catch(onErr("post announcement"));
      log(me.name, `Posted announcement "${title}"`);
    },
    deleteAnnouncement: (id) => {
      updateDoc(doc(db, "announcements", id), { title: "(removed)", body: "" }).catch(onErr("delete announcement"));
    },
    addFriend: async (otherUid) => {
      try { await updateDoc(doc(db, "users", user.uid), { friends: arrayUnion(otherUid) }); } catch (err) { onErr("add friend")(err); }
    },
    sendPeerMessage: async (otherUid, text) => {
      try {
        const threadId = [user.uid, otherUid].sort().join("__");
        await setDoc(doc(db, "peerThreads", threadId), { members: [user.uid, otherUid].sort(), updatedAt: now(), lastMessage: text }, { merge: true });
        await addDoc(collection(db, "peerThreads", threadId, "peerMessages"), { senderUid: user.uid, text, ts: now(), read: false });
      } catch (err) { onErr("send peer message")(err); }
    },
    markPeerThreadRead: (threadId) => {
      const msgs = peerMessagesByThread[threadId] || [];
      msgs.filter((m) => m.senderUid !== user.uid && !m.read).forEach((m) => {
        updateDoc(doc(db, "peerThreads", threadId, "peerMessages", m._id), { read: true }).catch(onErr("mark read"));
      });
    },
    updateMyProfile: (fields) => updateDoc(doc(db, "users", user.uid), fields).catch(onErr("update profile")),
  };

  const handleSignOut = () => signOut(auth);

  if (!authChecked) {
    return (
      <div className="arise-site" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.inkFaint, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="arise-site" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        <AuthScreen onSignedIn={() => {}} />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div className="arise-site" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
          <Onboarding onDone={() => setOnboarded(true)} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="arise-site" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.inkFaint, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{GLOBAL_CSS}</style>
        Loading…
      </div>
    );
  }

  return (
    <div className="arise-site" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: C.ink }}>
      <style>{GLOBAL_CSS}</style>
      <div className="arise-header">
        <div onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default", userSelect: "none" }}>
          <img src={LOGO_IMG} alt="ARISE logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <span style={{ ...serif, fontSize: 20, fontWeight: 700, color: C.primary }}>A.R.I.S.E.</span>
        </div>
        {roleMenuUnlocked && <RoleSwitcher current={role} onSwitch={setRole} />}
      </div>
      {dbError && (
        <div style={{ background: C.sosSoft, color: C.sosDark, padding: "10px 20px", fontSize: 12.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.sos}` }}>
          <span><strong>Database error:</strong> {dbError} — this usually means Firestore isn't set up yet, or its security rules are blocking access. Check Firebase Console → Firestore Database.</span>
          <button onClick={() => setDbError("")} style={{ background: "none", border: "none", color: C.sosDark, cursor: "pointer", flexShrink: 0 }}><X size={16} /></button>
        </div>
      )}
      <div className="arise-body">
        {role === "student" && <StudentApp shared={shared} actions={actions} me={me} onSignOut={handleSignOut} voiceOutUnread={voiceOutUnread} chatUnread={chatUnread} />}
        {role === "counselor" && <CounselorApp shared={shared} actions={actions} me={me} voiceOutUnread={voiceOutUnread} />}
        {role === "admin" && <AdminApp shared={shared} actions={actions} me={me} />}
      </div>
    </div>
  );
}
