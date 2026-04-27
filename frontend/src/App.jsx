import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Download,
  FileText,
  Lightbulb,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'

// ─── THEME ───────────────────────────────────────────────────────────────────

const themeMap = {
  dark: {
    bg: '#07080d',
    card: 'rgba(255,255,255,0.03)',
    cardSolid: '#0f111a',
    border: 'rgba(255,255,255,0.08)',
    text: '#e8eaf2',
    muted: '#5a6080',
    input: 'rgba(255,255,255,0.04)',
    inputText: '#e8eaf2',
    selectBg: '#0f111a',
  },
  light: {
    bg: '#f4f5fa',
    card: '#ffffff',
    cardSolid: '#ffffff',
    border: 'rgba(0,0,0,0.08)',
    text: '#111827',
    muted: '#9197b3',
    input: '#ffffff',
    inputText: '#111827',
    selectBg: '#ffffff',
  },
  accent: '#6366f1',
  accent2: '#818cf8',
  mint: '#10d9a4',
  amber: '#f59e0b',
  danger: '#f43f5e',
  rose: '#fb7185',
}

const getTheme = (dark) => (dark ? themeMap.dark : themeMap.light)

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

const normalizeResumeScore = (score) =>
  clamp(Math.round((Number(score) || 0) / 90 * 100), 0, 100)

const getScoreColor = (score) => {
  if (score > 7) return themeMap.mint
  if (score >= 4) return themeMap.amber
  return themeMap.danger
}

const getScoreColor100 = (score) => {
  if (score > 75) return themeMap.mint
  if (score >= 50) return themeMap.amber
  return themeMap.danger
}

const getAtsLabel = (score) => {
  if (score >= 80) return 'Pass'
  if (score >= 60) return 'Partial'
  return 'Risk'
}

/**
 * Parse the |SECTION| delimited AI feedback string into a structured object.
 */
function parseAiFeedback(raw) {
  if (!raw) return {}
  const result = {}
  const parts = raw.split('|SECTION|')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const newline = trimmed.indexOf('\n')
    if (newline === -1) continue
    const key = trimmed.slice(0, newline).trim()
    const body = trimmed.slice(newline + 1).trim()
    result[key] = body
  }
  return result
}

function extractReadinessScore(text) {
  if (!text) return null
  const match = text.match(/(\d+)%/)
  return match ? parseInt(match[1], 10) : null
}

function extractReadinessItems(text) {
  if (!text) return []
  return text
    .split('\n')
    .filter((l) => l.trim().startsWith('ITEM:'))
    .map((l) => l.replace(/^ITEM:\s*/, '').trim())
}

function extractAtsNumbers(text) {
  if (!text) return { ats: null, jd: null, kw: null }
  const ats = text.match(/ATS Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/)
  const jd = text.match(/JD Match:\s*(\d+(?:\.\d+)?)\s*\/\s*10/)
  const kw = text.match(/Keyword Coverage:\s*(\d+(?:\.\d+)?)\s*\/\s*10/)
  return {
    ats: ats ? parseFloat(ats[1]) : null,
    jd: jd ? parseFloat(jd[1]) : null,
    kw: kw ? parseFloat(kw[1]) : null,
  }
}

function extractMissingSkills(text) {
  if (!text) return []
  return text
    .split('\n')
    .filter((l) => l.trim().startsWith('CRITICAL:') || l.trim().startsWith('SECONDARY:'))
    .map((l) => {
      const isCritical = l.trim().startsWith('CRITICAL:')
      const content = l.replace(/^(CRITICAL|SECONDARY):\s*/, '').trim()
      const [skill, reason] = content.split(' — ')
      return { skill: skill?.trim(), reason: reason?.trim(), critical: isCritical }
    })
    .filter((s) => s.skill)
}

function extractImprovements(text) {
  if (!text) return []
  return text
    .split('\n')
    .filter((l) => l.trim().startsWith('IMPROVE:'))
    .map((l) => l.replace(/^IMPROVE:\s*/, '').trim())
}

function extractTips(text) {
  if (!text) return []
  return text
    .split('\n')
    .filter((l) => l.trim().startsWith('TIP:'))
    .map((l) => l.replace(/^TIP:\s*/, '').trim())
}

function extractInterviewQ(text) {
  if (!text) return { questions: [], prepTip: '' }
  const lines = text.split('\n')
  const questions = lines
    .filter((l) => l.trim().startsWith('Q:'))
    .map((l) => l.replace(/^Q:\s*/, '').trim())
  const prepLine = lines.find((l) => l.trim().startsWith('PREP TIP:'))
  const prepTip = prepLine ? prepLine.replace(/^PREP TIP:\s*/, '').trim() : ''
  return { questions, prepTip }
}

function extractRewrite(text) {
  if (!text) return { label: '', original: '', improved: '' }
  const rewritingMatch = text.match(/REWRITING:\s*(.+)/)
  const label = rewritingMatch ? rewritingMatch[1].trim() : ''
  const improvedMatch = text.split('IMPROVED VERSION:')
  const improved = improvedMatch.length > 1 ? improvedMatch[1].trim() : ''
  return { label, improved }
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────

function useCounter(target) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? Math.max(0, Math.round(target * 10) / 10) : 0
    if (safeTarget === 0) { setCount(0); return }
    let current = 0
    const steps = 30
    const increment = safeTarget / steps
    const timer = window.setInterval(() => {
      current += increment
      if (current >= safeTarget) { current = safeTarget; window.clearInterval(timer) }
      setCount(Math.round(current * 10) / 10)
    }, 28)
    return () => window.clearInterval(timer)
  }, [target])
  return count
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Pill({ label, present, dark }) {
  const theme = getTheme(dark)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
      background: present ? 'rgba(16,217,164,0.1)' : 'rgba(244,63,94,0.1)',
      border: `1px solid ${present ? 'rgba(16,217,164,0.3)' : 'rgba(244,63,94,0.28)'}`,
      color: theme.text,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: present ? themeMap.mint : 'transparent',
        border: `2px solid ${present ? themeMap.mint : themeMap.danger}`,
      }} />
      {label}
    </div>
  )
}

function ThemeToggle({ dark, setDark }) {
  const theme = getTheme(dark)
  return (
    <button type="button" onClick={() => setDark(v => !v)} aria-label="Toggle theme"
      style={{
        width: 72, height: 38, padding: 4, borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${theme.border}`,
        background: dark ? 'rgba(255,255,255,0.04)' : '#e8eaf4',
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
      <Sun size={14} color={dark ? theme.muted : themeMap.amber} style={{ marginLeft: 7, zIndex: 1 }} />
      <Moon size={14} color={dark ? theme.text : theme.muted} style={{ marginRight: 7, zIndex: 1 }} />
      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        style={{
          width: 28, height: 28, borderRadius: '50%', position: 'absolute',
          top: 4, left: dark ? 40 : 4,
          background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
        }} />
    </button>
  )
}

// Score out of 10
function MiniScore10({ label, value, dark }) {
  const theme = getTheme(dark)
  const safeVal = clamp(Number(value) || 0, 0, 10)
  const color = getScoreColor(safeVal)
  const pct = (safeVal / 10) * 100
  const counter = useCounter(safeVal)
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 20, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: theme.muted, fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: 22, fontWeight: 800 }}>
          {counter.toFixed(1)}<span style={{ fontSize: 13, color: theme.muted }}>/10</span>
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 999, overflow: 'hidden',
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 999, background: color }}
        />
      </div>
    </div>
  )
}

// Big score ring out of 100
function ScoreRing({ score, max = 100, dark, label }) {
  const theme = getTheme(dark)
  const safeScore = clamp(Math.round(Number(score) || 0), 0, max)
  const circumference = 2 * Math.PI * 54
  const scoreColor = getScoreColor100(safeScore)
  const counter = useCounter(safeScore)
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 22,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="54" fill="none"
            stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="11" />
          <motion.circle cx="75" cy="75" r="54" fill="none"
            stroke={scoreColor} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - circumference * (safeScore / max) }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform="rotate(-90 75 75)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ color: theme.text, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{counter}</div>
          <div style={{ color: theme.muted, fontSize: 11, fontWeight: 600 }}>/ {max}</div>
        </div>
      </div>
      <div style={{ color: theme.text, fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

// Readiness section — the big "You are X% ready" card
function ReadinessCard({ text, role, dark }) {
  const theme = getTheme(dark)
  const score = extractReadinessScore(text)
  const items = extractReadinessItems(text)
  const color = score === null ? theme.muted : score >= 70 ? themeMap.mint : score >= 45 ? themeMap.amber : themeMap.danger
  const counter = useCounter(score || 0)
  const roleName = role || 'this role'

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingUp size={22} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: theme.text, fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
            You are{' '}
            <span style={{ color }}>{counter}%</span>
            {' '}ready to become a {roleName}
          </div>
          <div style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
            Based on your resume vs the job description
          </div>
        </div>
        {/* Mini arc */}
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
          <circle cx="32" cy="32" r="26" fill="none"
            stroke={dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="7" />
          <motion.circle cx="32" cy="32" r="26" fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 26}
            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 26 - (2 * Math.PI * 26) * ((score || 0) / 100) }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform="rotate(-90 32 32)" />
          <text x="32" y="37" textAnchor="middle" fill={color}
            fontSize="13" fontWeight="700" fontFamily="inherit">
            {counter}%
          </text>
        </svg>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: theme.muted, fontSize: 12, fontWeight: 600 }}>Current readiness</span>
          <span style={{ color: theme.muted, fontSize: 12, fontWeight: 600 }}>Target: 85%</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score || 0}%` }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 999, background: color }}
          />
        </div>
        {/* 85% marker */}
        <div style={{ position: 'relative', height: 14 }}>
          <div style={{
            position: 'absolute', left: '85%', top: 0, transform: 'translateX(-50%)',
            width: 2, height: 10, background: theme.muted, borderRadius: 1,
          }} />
          <div style={{
            position: 'absolute', left: '85%', top: 0, transform: 'translateX(-50%)',
            color: theme.muted, fontSize: 10, fontWeight: 600, marginTop: 10, whiteSpace: 'nowrap',
          }}>85%</div>
        </div>
      </div>

      {/* To reach 85% items */}
      {items.length > 0 && (
        <div>
          <div style={{
            color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Target size={14} color={themeMap.accent} />
            To reach 85% readiness:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => {
              const [skill, reason] = item.split(' — ')
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 14,
                    background: dark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
                    border: `1px solid rgba(99,102,241,0.15)`,
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                    background: `rgba(99,102,241,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: themeMap.accent2,
                  }}>{i + 1}</div>
                  <div>
                    {reason ? (
                      <>
                        <div style={{ color: theme.text, fontSize: 14, fontWeight: 700 }}>{skill}</div>
                        <div style={{ color: theme.muted, fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{reason}</div>
                      </>
                    ) : (
                      <div style={{ color: theme.text, fontSize: 14, lineHeight: 1.5 }}>{item}</div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Tips & Tricks dynamic card
function TipsCard({ text, dark }) {
  const theme = getTheme(dark)
  const tips = extractTips(text)
  if (!tips.length) return null
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `rgba(245,158,11,0.12)`, border: `1px solid rgba(245,158,11,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lightbulb size={18} color={themeMap.amber} />
        </div>
        <div>
          <div style={{ color: theme.text, fontSize: 16, fontWeight: 800 }}>Tips & Tricks</div>
          <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            Curated for your resume + this JD
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tips.map((tip, i) => {
          const [action, why] = tip.split(' — ')
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14,
                background: dark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.04)',
                border: `1px solid rgba(245,158,11,0.15)`,
              }}>
              <span style={{
                fontSize: 12, color: themeMap.amber, fontWeight: 800, marginTop: 2, flexShrink: 0,
              }}>#{i + 1}</span>
              <div>
                {why ? (
                  <>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{action}</div>
                    <div style={{ color: theme.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{why}</div>
                  </>
                ) : (
                  <div style={{ color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{tip}</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Missing skills card
function MissingSkillsCard({ text, dark }) {
  const theme = getTheme(dark)
  const skills = extractMissingSkills(text)
  if (!skills.length) return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 24,
    }}>
      <div style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>No critical skill gaps detected.</div>
      <div style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>Your resume covers the key JD requirements.</div>
    </div>
  )
  const critical = skills.filter(s => s.critical)
  const secondary = skills.filter(s => !s.critical)
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertTriangle size={18} color={themeMap.danger} />
        <div style={{ color: theme.text, fontSize: 16, fontWeight: 800 }}>Skill Gaps</div>
      </div>
      {critical.length > 0 && (
        <div>
          <div style={{ color: themeMap.danger, fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>CRITICAL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {critical.map((s, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)',
              }}>
                <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{s.skill}</div>
                {s.reason && <div style={{ color: theme.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{s.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {secondary.length > 0 && (
        <div>
          <div style={{ color: themeMap.amber, fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>SECONDARY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {secondary.map((s, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{s.skill}</div>
                {s.reason && <div style={{ color: theme.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{s.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ATS compatibility meter
function ATSMeter({ score, dark }) {
  const theme = getTheme(dark)
  const safeScore = clamp(Math.round(Number(score) || 0), 0, 100)
  const label = getAtsLabel(safeScore)
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: theme.text, fontSize: 16, fontWeight: 800 }}>ATS Compatibility</div>
          <div style={{ color: theme.muted, fontSize: 13, marginTop: 3 }}>Parser confidence score</div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13,
          background: label === 'Pass' ? 'rgba(16,217,164,0.12)' : label === 'Partial' ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
          border: `1px solid ${label === 'Pass' ? 'rgba(16,217,164,0.3)' : label === 'Partial' ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`,
          color: theme.text,
        }}>{label}</div>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${safeScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${themeMap.danger} 0%, ${themeMap.amber} 55%, ${themeMap.mint} 100%)`,
          }}
        />
      </div>
      <div style={{ color: theme.text, fontSize: 14, fontWeight: 700 }}>{safeScore}/100</div>
    </div>
  )
}

// ─── LOADING MESSAGES ────────────────────────────────────────────────────────
const loadingMessages = [
  'Reading your resume and extracting content...',
  'Scoring ATS compatibility and section coverage...',
  'Matching resume against the job description...',
  'Generating curated suggestions and rewrite...',
]

const platforms = [
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { key: 'naukri', label: 'Naukri', emoji: '🔶' },
  { key: 'internshala', label: 'Internshala', emoji: '🎓' },
]

// ─── APP ─────────────────────────────────────────────────────────────────────
function App() {
  // State
  const [file, setFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [platform, setPlatform] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [dark, setDark] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [loadingIndex, setLoadingIndex] = useState(0)
  const [editedResume, setEditedResume] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('general')
  const [activeTab, setActiveTab] = useState('suggestions') // suggestions | rewrite | interview

  const theme = getTheme(dark)

  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.background = theme.bg
    document.body.style.color = theme.text
    document.body.style.fontFamily = '"Segoe UI", system-ui, sans-serif'
  }, [theme.bg, theme.text])

  useEffect(() => {
    if (!loading) return
    const timer = window.setInterval(() => {
      setLoadingIndex(c => (c + 1) % loadingMessages.length)
    }, 1700)
    return () => window.clearInterval(timer)
  }, [loading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: (accepted, rejected) => {
      if (rejected?.length) { setError('Only PDF and DOCX files are supported.'); return }
      setError(null)
      setFile(accepted?.[0] || null)
    },
  })

  // Derived values
  const resumeScore = useMemo(() => normalizeResumeScore(results?.score_data?.total_score), [results])
  const atsScore = useMemo(() => clamp(resumeScore - (results?.ats_issues?.length || 0) * 8, 0, 100), [results, resumeScore])

  // JD match score is out of 10 now from updated matcher
  const jdScore10 = useMemo(() => {
    const s = results?.jd_match?.match_score
    if (s === null || s === undefined) return null
    return clamp(Number(s), 0, 10)
  }, [results])

  // Parsed AI feedback
  const aiFeedback = useMemo(() => parseAiFeedback(results?.ai_feedback), [results])
  const atsNumbers = useMemo(() => extractAtsNumbers(aiFeedback.ATS_SCORE), [aiFeedback])
  const improvements = useMemo(() => extractImprovements(aiFeedback.IMPROVEMENTS), [aiFeedback])
  const rewrite = useMemo(() => extractRewrite(aiFeedback.REWRITE), [aiFeedback])
  const interview = useMemo(() => extractInterviewQ(aiFeedback.INTERVIEW_PREP), [aiFeedback])

  // Recruiter decision
  const recruiterDecision = useMemo(() => {
    const raw = aiFeedback.RECRUITER_DECISION || ''
    const firstLine = raw.split('\n')[0].trim().toUpperCase()
    if (firstLine.includes('SHORTLISTED')) return 'SHORTLISTED'
    if (firstLine.includes('REJECTED')) return 'REJECTED'
    return 'MAYBE'
  }, [aiFeedback])

  const recruiterReason = useMemo(() => {
    const raw = aiFeedback.RECRUITER_DECISION || ''
    return raw.split('\n').slice(1).join(' ').trim()
  }, [aiFeedback])

  const handleAnalyze = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jd_text', jdText)
    formData.append('platform', platform || '')
    formData.append('role', role)
    try {
      setLoadingIndex(0)
      setLoading(true)
      setError(null)
      setResults(null)
      setDownloadSuccess(false)
      const response = await axios.post('http://localhost:8000/upload', formData)
      setResults(response.data)
      setEditedResume(response.data.optimized_text || response.data.extracted_text || '')
      setActiveTab('suggestions')
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to analyze resume.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloadLoading(true)
    setDownloadSuccess(false)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('resume_text', editedResume)
      formData.append('platform', selectedFormat)
      if (jdText) formData.append('jd_text', jdText)
      formData.append('role', role)
      const response = await axios.post('http://localhost:8000/download', formData, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `optimized_resume_${selectedFormat}.docx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch {
      setError('Download failed. Make sure the backend is running.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null); setJdText(''); setPlatform(null); setRole('')
    setLoading(false); setResults(null); setError(null)
    setDownloadLoading(false); setDownloadSuccess(false)
    setEditedResume(''); setSelectedFormat('general'); setActiveTab('suggestions')
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, transition: 'background 0.25s, color 0.25s' }}>
      <style>{`
        * { box-sizing: border-box; }
        textarea, select, input { font-family: inherit; }
        .jf-shell { width: min(1400px, calc(100% - 24px)); margin: 0 auto; }
        .jf-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: start; }
        .jf-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .jf-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 1100px) { .jf-3col { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .jf-2col, .jf-scores { grid-template-columns: 1fr; } }
        .jf-tab { background: none; border: none; cursor: pointer; font-family: inherit;
          padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; transition: all 0.2s; }
        .jf-tab:hover { opacity: 0.8; }
        textarea:focus { outline: none; }
        select option { background: ${theme.selectBg}; color: ${theme.text}; }
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: dark ? 'rgba(7,8,13,0.85)' : 'rgba(244,245,250,0.85)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div className="jf-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
              display: 'grid', placeItems: 'center',
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>JobFit Analyzer</div>
              <div style={{ fontSize: 12, color: theme.muted }}>AI-powered resume intelligence</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {results && (
              <button type="button" onClick={handleReset} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10,
                background: 'none', border: `1px solid ${theme.border}`, color: theme.muted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                <RotateCcw size={13} /> New Analysis
              </button>
            )}
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>
        </div>
      </div>

      <div className="jf-shell" style={{ padding: '20px 0 60px' }}>

        {/* ── ERROR ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                marginBottom: 16, padding: '12px 16px', borderRadius: 14,
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                color: theme.text, display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <X size={15} color={themeMap.danger} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UPLOAD FORM ── */}
        <AnimatePresence mode="wait">
          {!results && !loading && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* Hero */}
              <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
                <div style={{
                  fontSize: 'clamp(30px, 6vw, 58px)', fontWeight: 900,
                  letterSpacing: '-0.04em', lineHeight: 1.05,
                  background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>
                  Upload Once. Get Hired Faster.
                </div>
                <div style={{ marginTop: 12, color: theme.muted, fontSize: 15, maxWidth: 600, marginInline: 'auto', lineHeight: 1.7 }}>
                  Drop your resume, add a job description, and get a 3-panel analysis — original, JD comparison, and optimized resume.
                </div>
              </div>

              <div style={{
                background: theme.card, border: `1px solid ${theme.border}`,
                borderRadius: 28, padding: 22, display: 'grid', gap: 18,
              }}>
                {/* Dropzone */}
                <div {...getRootProps()} style={{
                  borderRadius: 20, border: `1.5px dashed ${isDragActive ? themeMap.accent : theme.border}`,
                  background: isDragActive ? (dark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)') : (dark ? 'rgba(255,255,255,0.02)' : '#fbfbff'),
                  padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <input {...getInputProps()} />
                  <div style={{
                    width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16,
                    background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Upload size={24} color="#fff" />
                  </div>
                  <div style={{ color: theme.text, fontSize: 17, fontWeight: 800 }}>
                    {isDragActive ? 'Drop it here' : 'Upload Your Resume'}
                  </div>
                  <div style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>PDF or DOCX supported</div>
                  {file && (
                    <div style={{
                      marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 999,
                      background: 'rgba(16,217,164,0.1)', border: '1px solid rgba(16,217,164,0.3)',
                      color: theme.text, fontSize: 13, fontWeight: 700,
                    }}>
                      <CheckCircle size={14} color={themeMap.mint} /> {file.name}
                    </div>
                  )}
                </div>

                {/* JD text */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: theme.muted, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>
                    JOB DESCRIPTION (optional — enables JD match + curated suggestions)
                  </label>
                  <textarea value={jdText} onChange={e => setJdText(e.target.value)}
                    placeholder="Paste the full job description here for best results..."
                    style={{
                      width: '100%', minHeight: 130, resize: 'vertical', borderRadius: 16,
                      border: `1px solid ${theme.border}`,
                      background: theme.input, color: theme.inputText,
                      padding: 14, fontSize: 14, lineHeight: 1.6,
                    }}
                  />
                </div>

                <div className="jf-2col">
                  {/* Platform */}
                  <div>
                    <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Target Platform</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {platforms.map(p => {
                        const active = platform === p.key
                        return (
                          <button key={p.key} type="button" onClick={() => setPlatform(c => c === p.key ? null : p.key)}
                            style={{
                              borderRadius: 12, border: `1px solid ${active ? themeMap.accent : theme.border}`,
                              background: active ? 'rgba(99,102,241,0.12)' : 'none',
                              color: active ? themeMap.accent2 : theme.text,
                              padding: '9px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            <Briefcase size={13} color={active ? themeMap.accent : theme.muted} />
                            {p.emoji} {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Role — FIXED dark mode */}
                  <div>
                    <label htmlFor="role-select" style={{ display: 'block', marginBottom: 8, color: theme.muted, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>
                      TARGET ROLE (optional)
                    </label>
                    <select id="role-select" value={role} onChange={e => setRole(e.target.value)}
                      style={{
                        width: '100%', borderRadius: 12, border: `1px solid ${theme.border}`,
                        background: theme.selectBg,
                        color: theme.inputText,  /* FIXED: explicit text color for dark mode */
                        padding: '11px 14px', fontSize: 14, outline: 'none', cursor: 'pointer',
                        appearance: 'auto',
                      }}>
                      <option value="" style={{ background: theme.selectBg, color: theme.inputText }}>Select target role</option>
                      <option value="Developer" style={{ background: theme.selectBg, color: theme.inputText }}>Developer</option>
                      <option value="Analyst" style={{ background: theme.selectBg, color: theme.inputText }}>Data Analyst</option>
                      <option value="Designer" style={{ background: theme.selectBg, color: theme.inputText }}>Designer</option>
                      <option value="Marketing" style={{ background: theme.selectBg, color: theme.inputText }}>Marketing</option>
                      <option value="General" style={{ background: theme.selectBg, color: theme.inputText }}>General</option>
                    </select>
                  </div>
                </div>

                {file && (
                  <button type="button" onClick={handleAnalyze} style={{
                    width: '100%', border: 'none', borderRadius: 18, padding: '16px',
                    background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                    color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 16px 36px rgba(99,102,241,0.3)',
                  }}>
                    Analyze My Resume →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOADING ── */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                marginTop: 8, background: theme.card, border: `1px solid ${theme.border}`,
                borderRadius: 28, padding: '48px 24px', textAlign: 'center',
              }}>
              <div style={{ width: 100, height: 100, margin: '0 auto 20px', position: 'relative' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderTopColor: themeMap.accent, borderRightColor: themeMap.accent }} />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.0, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '4px solid transparent', borderBottomColor: themeMap.mint, borderLeftColor: themeMap.mint }} />
              </div>
              <div style={{ color: theme.text, fontSize: 20, fontWeight: 800 }}>Analyzing your resume</div>
              <div style={{ color: theme.muted, fontSize: 14, marginTop: 10 }}>{loadingMessages[loadingIndex]}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── THREE-PANEL RESULTS ── */}
        <AnimatePresence mode="wait">
          {results && !loading && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

              {/* Top scores row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: jdScore10 !== null ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                gap: 14, marginBottom: 16,
              }}>
                <ScoreRing score={resumeScore} dark={dark} label="Resume Score" />
                <ScoreRing score={atsScore} dark={dark} label="ATS Score" />
                {jdScore10 !== null && (
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 24, padding: 22,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                  }}>
                    <div style={{ color: theme.muted, fontSize: 13, fontWeight: 600 }}>JD Match</div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: getScoreColor(jdScore10), lineHeight: 1 }}>
                      {jdScore10.toFixed(1)}
                    </div>
                    <div style={{ color: theme.muted, fontSize: 13 }}>out of 10</div>
                    <div style={{ height: 6, width: '100%', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(jdScore10 / 10) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 999, background: getScoreColor(jdScore10) }} />
                    </div>
                  </div>
                )}
              </div>

              {/* AI score row (from Gemini analysis) */}
              {(atsNumbers.ats !== null || atsNumbers.jd !== null) && (
                <div className="jf-scores" style={{ marginBottom: 16 }}>
                  {atsNumbers.ats !== null && <MiniScore10 label="ATS (AI Analysis)" value={atsNumbers.ats} dark={dark} />}
                  {atsNumbers.jd !== null && <MiniScore10 label="JD Alignment (AI)" value={atsNumbers.jd} dark={dark} />}
                  {atsNumbers.kw !== null && <MiniScore10 label="Keyword Coverage" value={atsNumbers.kw} dark={dark} />}
                </div>
              )}

              {/* Recruiter decision banner */}
              {aiFeedback.RECRUITER_DECISION && (
                <div style={{
                  marginBottom: 16, padding: '14px 20px', borderRadius: 18,
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  background: recruiterDecision === 'SHORTLISTED' ? 'rgba(16,217,164,0.08)'
                    : recruiterDecision === 'REJECTED' ? 'rgba(244,63,94,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${recruiterDecision === 'SHORTLISTED' ? 'rgba(16,217,164,0.25)'
                    : recruiterDecision === 'REJECTED' ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}>
                  <div style={{
                    padding: '6px 16px', borderRadius: 999, fontWeight: 800, fontSize: 14, flexShrink: 0,
                    background: recruiterDecision === 'SHORTLISTED' ? themeMap.mint
                      : recruiterDecision === 'REJECTED' ? themeMap.danger : themeMap.amber,
                    color: '#fff',
                  }}>{recruiterDecision}</div>
                  <div style={{ color: theme.text, fontSize: 14, lineHeight: 1.5, flex: 1, minWidth: 200 }}>{recruiterReason}</div>
                </div>
              )}

              {/* ─── THE 3-PANEL LAYOUT ─── */}
              <div className="jf-3col">

                {/* PANEL 1 — Your Resume (original) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, padding: '12px 18px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <FileText size={16} color={themeMap.accent} />
                    <div>
                      <div style={{ color: theme.text, fontSize: 14, fontWeight: 800 }}>Your Resume</div>
                      <div style={{ color: theme.muted, fontSize: 12 }}>Original uploaded content</div>
                    </div>
                  </div>

                  {/* Section analysis */}
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, padding: 18,
                  }}>
                    <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Section Coverage</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(results?.score_data?.found_sections || []).map(s => <Pill key={s} label={s} present dark={dark} />)}
                      {(results?.score_data?.missing_sections || []).map(s => <Pill key={s} label={s} present={false} dark={dark} />)}
                    </div>
                  </div>

                  <ATSMeter score={atsScore} dark={dark} />

                  {/* Raw resume text */}
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '12px 16px', borderBottom: `1px solid ${theme.border}`,
                      color: theme.text, fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <FileText size={13} color={theme.muted} /> Extracted Text
                    </div>
                    <pre style={{
                      margin: 0, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      color: theme.muted, fontSize: 12, lineHeight: 1.7, maxHeight: 360, overflowY: 'auto',
                      fontFamily: 'Consolas, monospace',
                    }}>
                      {results?.extracted_text || 'No text extracted.'}
                    </pre>
                  </div>
                </div>

                {/* PANEL 2 — JD + Suggestions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, padding: '12px 18px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Target size={16} color={themeMap.mint} />
                    <div>
                      <div style={{ color: theme.text, fontSize: 14, fontWeight: 800 }}>JD + Suggestions</div>
                      <div style={{ color: theme.muted, fontSize: 12 }}>Curated for your resume & this JD</div>
                    </div>
                  </div>

                  {/* Readiness card */}
                  {aiFeedback.READINESS_SCORE && (
                    <ReadinessCard text={aiFeedback.READINESS_SCORE} role={role} dark={dark} />
                  )}

                  {/* JD keywords */}
                  {jdText && (results?.jd_match?.missing_keywords || []).length > 0 && (
                    <div style={{
                      background: theme.card, border: `1px solid ${theme.border}`,
                      borderRadius: 20, padding: 18,
                    }}>
                      <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                        Keywords Missing from Your Resume
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {results.jd_match.missing_keywords.map(kw => (
                          <div key={kw} style={{
                            padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                            color: theme.text,
                          }}>+ {kw}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing skills */}
                  {aiFeedback.MISSING_SKILLS && <MissingSkillsCard text={aiFeedback.MISSING_SKILLS} dark={dark} />}

                  {/* Tabs: Suggestions | Rewrite | Interview */}
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex', gap: 6, padding: '10px 12px',
                      borderBottom: `1px solid ${theme.border}`,
                      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    }}>
                      {[
                        { id: 'suggestions', label: 'Improvements' },
                        { id: 'rewrite', label: 'Rewrite Sample' },
                        { id: 'interview', label: 'Interview Prep' },
                      ].map(tab => (
                        <button key={tab.id} className="jf-tab" onClick={() => setActiveTab(tab.id)}
                          style={{
                            color: activeTab === tab.id ? themeMap.accent2 : theme.muted,
                            background: activeTab === tab.id ? 'rgba(99,102,241,0.12)' : 'none',
                            border: activeTab === tab.id ? `1px solid rgba(99,102,241,0.2)` : '1px solid transparent',
                          }}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: 18 }}>
                      {activeTab === 'suggestions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {improvements.length > 0 ? improvements.map((imp, i) => {
                            const [action, why] = imp.split(' — ')
                            return (
                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                style={{
                                  display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14,
                                  background: dark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)',
                                  border: '1px solid rgba(99,102,241,0.15)',
                                }}>
                                <div style={{
                                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                  background: 'rgba(99,102,241,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 800, color: themeMap.accent2,
                                }}>{i + 1}</div>
                                <div>
                                  {why ? (
                                    <>
                                      <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{action}</div>
                                      <div style={{ color: theme.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{why}</div>
                                    </>
                                  ) : (
                                    <div style={{ color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{imp}</div>
                                  )}
                                </div>
                              </motion.div>
                            )
                          }) : <div style={{ color: theme.muted, fontSize: 14 }}>No specific improvements identified.</div>}
                        </div>
                      )}

                      {activeTab === 'rewrite' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {rewrite.label && (
                            <div style={{
                              padding: '6px 12px', borderRadius: 8, display: 'inline-block',
                              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                              color: themeMap.accent2, fontSize: 12, fontWeight: 700,
                            }}>Rewriting: {rewrite.label}</div>
                          )}
                          {rewrite.improved ? (
                            <div style={{
                              padding: 14, borderRadius: 14,
                              background: dark ? 'rgba(16,217,164,0.06)' : 'rgba(16,217,164,0.05)',
                              border: '1px solid rgba(16,217,164,0.2)',
                              color: theme.text, fontSize: 13, lineHeight: 1.7,
                            }}>
                              <div style={{ color: themeMap.mint, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>IMPROVED VERSION</div>
                              {rewrite.improved}
                            </div>
                          ) : (
                            <div style={{ color: theme.muted, fontSize: 14 }}>No rewrite sample generated.</div>
                          )}
                        </div>
                      )}

                      {activeTab === 'interview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {interview.questions.length > 0 ? interview.questions.map((q, i) => (
                            <div key={i} style={{
                              padding: '12px 14px', borderRadius: 14,
                              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${theme.border}`,
                            }}>
                              <span style={{ color: themeMap.accent2, fontWeight: 700, fontSize: 12 }}>Q{i + 1} </span>
                              <span style={{ color: theme.text, fontSize: 13, lineHeight: 1.6 }}>{q}</span>
                            </div>
                          )) : <div style={{ color: theme.muted, fontSize: 14 }}>No interview questions generated.</div>}
                          {interview.prepTip && (
                            <div style={{
                              padding: '12px 14px', borderRadius: 14,
                              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                            }}>
                              <div style={{ color: themeMap.amber, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PREP TIP</div>
                              <div style={{ color: theme.text, fontSize: 13, lineHeight: 1.6 }}>{interview.prepTip}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tips & tricks */}
                  {aiFeedback.TIPS_AND_TRICKS && <TipsCard text={aiFeedback.TIPS_AND_TRICKS} dark={dark} />}
                </div>

                {/* PANEL 3 — Optimized Resume (editable) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, padding: '12px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Sparkles size={16} color={themeMap.mint} />
                      <div>
                        <div style={{ color: theme.text, fontSize: 14, fontWeight: 800 }}>AI-Optimized Resume</div>
                        <div style={{ color: theme.muted, fontSize: 12 }}>Edit freely, then download</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button"
                        onClick={() => setEditedResume(results.optimized_text || results.extracted_text || '')}
                        style={{
                          padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: 'rgba(16,217,164,0.1)', border: '1px solid rgba(16,217,164,0.25)',
                          color: themeMap.mint,
                        }}>
                        Reset AI
                      </button>
                      <button type="button"
                        onClick={() => setEditedResume(results.extracted_text || '')}
                        style={{
                          padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                          color: themeMap.amber,
                        }}>
                        Original
                      </button>
                    </div>
                  </div>

                  {/* Live editor */}
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '10px 14px', borderBottom: `1px solid ${theme.border}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: dark ? 'rgba(16,217,164,0.04)' : 'rgba(16,217,164,0.03)',
                    }}>
                      <span style={{ color: themeMap.mint, fontSize: 12, fontWeight: 700 }}>LIVE EDITOR</span>
                      <span style={{ color: theme.muted, fontSize: 11 }}>{editedResume.length} chars</span>
                    </div>
                    <textarea
                      value={editedResume}
                      onChange={e => setEditedResume(e.target.value)}
                      spellCheck
                      placeholder="Your AI-optimized resume will appear here for editing..."
                      style={{
                        width: '100%', minHeight: 480, resize: 'vertical', border: 'none',
                        background: dark ? 'rgba(255,255,255,0.01)' : '#fafbff',
                        color: theme.inputText,
                        padding: '16px', fontSize: 12.5, lineHeight: 1.8,
                        fontFamily: 'Consolas, "Courier New", monospace',
                      }}
                      onFocus={e => { e.target.style.outline = `2px solid ${themeMap.mint}40` }}
                      onBlur={e => { e.target.style.outline = 'none' }}
                    />
                    <div style={{
                      padding: '10px 14px', borderTop: `1px solid ${theme.border}`,
                      color: theme.muted, fontSize: 11, lineHeight: 1.5,
                      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    }}>
                      Edit the text above, then download with your chosen format below.
                    </div>
                  </div>

                  {/* Format selector */}
                  <div style={{
                    background: theme.card, border: `1px solid ${theme.border}`,
                    borderRadius: 20, padding: 18,
                  }}>
                    <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Download Format</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {[
                        { id: 'linkedin', emoji: '💼', label: 'LinkedIn', color: '#0077b5' },
                        { id: 'naukri', emoji: '🔶', label: 'Naukri', color: '#ff7555' },
                        { id: 'internshala', emoji: '🎓', label: 'Internshala', color: '#1bca8c' },
                        { id: 'general', emoji: '📄', label: 'General ATS', color: '#6366f1' },
                      ].map(fmt => (
                        <button key={fmt.id} type="button" onClick={() => setSelectedFormat(fmt.id)}
                          style={{
                            borderRadius: 12, cursor: 'pointer', padding: '10px 12px', textAlign: 'left',
                            border: selectedFormat === fmt.id ? `2px solid ${fmt.color}` : `1px solid ${theme.border}`,
                            background: selectedFormat === fmt.id ? `${fmt.color}14` : 'none',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ fontSize: 16, marginBottom: 2 }}>{fmt.emoji}</div>
                          <div style={{
                            color: selectedFormat === fmt.id ? fmt.color : theme.text,
                            fontSize: 12, fontWeight: 700,
                          }}>{fmt.label}</div>
                        </button>
                      ))}
                    </div>

                    <button type="button" onClick={handleDownload} disabled={downloadLoading}
                      style={{
                        width: '100%', border: 'none', borderRadius: 14, padding: '14px',
                        background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                        color: '#fff', fontSize: 14, fontWeight: 800, cursor: downloadLoading ? 'not-allowed' : 'pointer',
                        opacity: downloadLoading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                      <Download size={15} />
                      {downloadLoading ? 'Generating...' : `Download ${selectedFormat === 'linkedin' ? 'LinkedIn' : selectedFormat === 'naukri' ? 'Naukri' : selectedFormat === 'internshala' ? 'Internshala' : 'General ATS'} Resume`}
                    </button>

                    <AnimatePresence>
                      {downloadSuccess && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          style={{
                            marginTop: 10, padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(16,217,164,0.1)', border: '1px solid rgba(16,217,164,0.25)',
                            color: theme.text, fontSize: 13, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                          <CheckCircle size={14} color={themeMap.mint} />
                          Downloaded successfully!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
