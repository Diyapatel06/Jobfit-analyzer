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
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Upload,
  X,
  Zap,
} from 'lucide-react'

const themeMap = {
  dark: {
    bg: '#050508',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.07)',
    text: '#fff',
    muted: '#666',
  },
  light: {
    bg: '#f7f7fc',
    card: '#fff',
    border: 'rgba(0,0,0,0.08)',
    text: '#111',
    muted: '#999',
  },
  accent: '#7c3aed',
  mint: '#00c896',
  warning: '#f5a623',
  danger: '#ff4d6d',
}

const loadingMessages = [
  'Reading your resume and extracting the content...',
  'Scoring core sections and ATS compatibility...',
  'Matching your resume against the job description...',
  'Generating focused feedback to improve your chances...',
]

const platforms = [
  { key: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { key: 'naukri', label: 'Naukri', emoji: '🔶' },
  { key: 'internshala', label: 'Internshala', emoji: '🎓' },
]

const featurePills = [
  { label: 'Resume Score', icon: TrendingUp },
  { label: 'ATS Rating', icon: Shield },
  { label: 'JD Match', icon: Target },
  { label: 'Download', icon: Download },
]

const getActiveTheme = (dark) => (dark ? themeMap.dark : themeMap.light)

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const normalizeResumeScore = (score) => clamp(Math.round((Number(score) || 0) / 90 * 100), 0, 100)

const splitFeedback = (feedback) => {
  if (!feedback) return []
  return feedback
    .split(/\n/)
    .map(item => item.trim())
    .filter(item => item.length > 2)
}

const getScoreColor = (score) => {
  if (score > 75) return themeMap.mint
  if (score >= 50) return themeMap.warning
  return themeMap.danger
}

const getAtsLabel = (score) => {
  if (score >= 80) return 'Pass'
  if (score >= 60) return 'Partial'
  return 'Risk'
}

// Animated counter hook for score labels.
function useCounter(target) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? Math.max(0, Math.round(target)) : 0

    if (safeTarget === 0) {
      const resetTimer = window.setTimeout(() => setCount(0), 0)
      return () => window.clearTimeout(resetTimer)
    }

    let current = 0
    const steps = 36
    const increment = Math.max(1, Math.ceil(safeTarget / steps))
    const timer = window.setInterval(() => {
      current += increment

      if (current >= safeTarget) {
        current = safeTarget
        window.clearInterval(timer)
      }

      setCount(current)
    }, 24)

    return () => window.clearInterval(timer)
  }, [target])

  return count
}

// Small status pill for present and missing resume sections.
function Pill({ label, present, dark }) {
  const theme = getActiveTheme(dark)

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 999,
        background: present ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,109,0.12)',
        border: `1px solid ${present ? 'rgba(0,200,150,0.3)' : 'rgba(255,77,109,0.26)'}`,
        color: theme.text,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: present ? themeMap.mint : 'transparent',
          border: `2px solid ${present ? themeMap.mint : themeMap.danger}`,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  )
}

// Animated theme toggle with a sliding spring knob.
function ThemeToggle({ dark, setDark }) {
  const theme = getActiveTheme(dark)

  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle theme"
      style={{
        width: 76,
        height: 40,
        padding: 4,
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: dark ? 'rgba(255,255,255,0.04)' : '#ececf5',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Sun size={15} color={dark ? theme.muted : themeMap.warning} style={{ marginLeft: 8, zIndex: 1 }} />
      <Moon size={15} color={dark ? theme.text : theme.muted} style={{ marginRight: 8, zIndex: 1 }} />
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
          position: 'absolute',
          top: 4,
          left: dark ? 42 : 4,
          boxShadow: '0 10px 30px rgba(124,58,237,0.35)',
        }}
      />
    </button>
  )
}

// Circular score widget with animated SVG stroke and counter text.
function ScoreRing({ score, max = 100, dark, label }) {
  const theme = getActiveTheme(dark)
  const safeScore = clamp(Math.round(Number(score) || 0), 0, max)
  const progress = safeScore / max
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const scoreColor = getScoreColor(safeScore)
  const counter = useCounter(safeScore)

  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        backdropFilter: 'blur(18px)',
      }}
    >
      <div style={{ position: 'relative', width: 150, height: 150 }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            strokeWidth="12"
          />
          <motion.circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - circumference * progress }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform="rotate(-90 75 75)"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ color: theme.text, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{counter}</div>
          <div style={{ color: theme.muted, fontSize: 12, fontWeight: 600 }}>
            / {max}
          </div>
        </div>
      </div>
      <div style={{ color: theme.text, fontSize: 16, fontWeight: 700, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

// Horizontal ATS meter with animated fill and clear scoring zones.
function ATSMeter({ score, dark }) {
  const theme = getActiveTheme(dark)
  const safeScore = clamp(Math.round(Number(score) || 0), 0, 100)
  const label = getAtsLabel(safeScore)
  const zoneCards = [
    { title: 'Pass', range: '80-100', color: themeMap.mint, bg: 'rgba(0,200,150,0.12)' },
    { title: 'Review', range: '60-79', color: themeMap.warning, bg: 'rgba(245,166,35,0.12)' },
    { title: 'Reject', range: '0-59', color: themeMap.danger, bg: 'rgba(255,77,109,0.12)' },
  ]

  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>ATS Compatibility</div>
          <div style={{ color: theme.muted, fontSize: 14 }}>Automated parser confidence for your resume format</div>
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background:
              label === 'Pass'
                ? 'rgba(0,200,150,0.12)'
                : label === 'Partial'
                  ? 'rgba(245,166,35,0.12)'
                  : 'rgba(255,77,109,0.12)',
            border: `1px solid ${
              label === 'Pass'
                ? 'rgba(0,200,150,0.28)'
                : label === 'Partial'
                  ? 'rgba(245,166,35,0.28)'
                  : 'rgba(255,77,109,0.26)'
            }`,
            color: theme.text,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {label}
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: 14,
          borderRadius: 999,
          overflow: 'hidden',
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${themeMap.danger} 0%, ${themeMap.warning} 55%, ${themeMap.mint} 100%)`,
          }}
        />
      </div>

      <div style={{ color: theme.text, fontSize: 14, fontWeight: 700 }}>{safeScore}/100</div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        {zoneCards.map((zone) => (
          <div
            key={zone.title}
            style={{
              borderRadius: 18,
              padding: 14,
              background: zone.bg,
              border: `1px solid ${zone.color}33`,
            }}
          >
            <div style={{ color: zone.color, fontSize: 14, fontWeight: 800 }}>{zone.title}</div>
            <div style={{ color: theme.text, fontSize: 15, fontWeight: 700, marginTop: 6 }}>{zone.range}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const MotionSection = motion.section
  const MotionDiv = motion.div

  // Core app state required by the project.
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

  // Supporting UI state for responsive polish and loading feedback.
  const [loadingIndex, setLoadingIndex] = useState(0)
  const [editedResume, setEditedResume] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('general')
  const [showEditor, setShowEditor] = useState(false)

  const theme = getActiveTheme(dark)

  // Keep the browser chrome aligned with the active theme.
  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.background = theme.bg
    document.body.style.color = theme.text
    document.body.style.fontFamily = '"Segoe UI", "Trebuchet MS", sans-serif'
  }, [theme.bg, theme.text])

  // Rotate loading copy while the analysis request is in flight.
  useEffect(() => {
    if (!loading) return undefined

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingMessages.length)
    }, 1600)

    return () => window.clearInterval(timer)
  }, [loading])

  // Dropzone setup for PDF and DOCX resume uploads.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles?.length) {
        setError('Only PDF and DOCX files are supported.')
        return
      }

      const nextFile = acceptedFiles?.[0] || null
      setError(null)
      setFile(nextFile)
    },
  })

  // Derived scores for the results dashboard.
  const resumeScore = useMemo(() => normalizeResumeScore(results?.score_data?.total_score), [results])
  const atsScore = useMemo(() => clamp(resumeScore - (results?.ats_issues?.length || 0) * 8, 0, 100), [results, resumeScore])
  const jdScore = useMemo(() => {
    if (results?.jd_match?.match_score === null || results?.jd_match?.match_score === undefined) return null
    return clamp(Math.round(results.jd_match.match_score), 0, 100)
  }, [results])
  const feedbackPoints = useMemo(() => splitFeedback(results?.ai_feedback), [results])

  // Submit the resume for backend analysis.
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
      setResults(response.data)
      setEditedResume(response.data.optimized_text || response.data.extracted_text || '')
      setShowEditor(false)
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || requestError?.message || 'Failed to analyze the resume.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger optimized resume download from the backend.
const handleDownload = async () => {
  setDownloadLoading(true)
  setDownloadSuccess(false)
  setError(null)

  try {
    const formData = new FormData()
    // Send the edited resume text directly
    formData.append('resume_text', editedResume)
    formData.append('platform', selectedFormat)
    if (jdText) formData.append('jd_text', jdText)
    formData.append('role', role)

    const response = await axios.post(
      'http://localhost:8000/download',
      formData,
      { responseType: 'blob' }
    )

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
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
  } catch (err) {
    setError('Download failed. Make sure the backend is running.')
  } finally {
    setDownloadLoading(false)
  }
}

  // Reset the analyzer so another resume can be processed.
  const handleReset = () => {
    setFile(null)
  setJdText('')
  setPlatform(null)
  setRole('')
  setLoading(false)
  setResults(null)
  setError(null)
  setDownloadLoading(false)
  setDownloadSuccess(false)
  setEditedResume('')
  setSelectedFormat('general')
  setShowEditor(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        transition: 'background 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Global responsive styles kept local to this component. */}
      <style>{`
        * { box-sizing: border-box; }
        .jobfit-shell {
          width: min(1180px, calc(100% - 24px));
          margin: 0 auto;
        }
        .jobfit-results-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .jobfit-main-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .jobfit-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .jobfit-results-grid,
          .jobfit-main-grid,
          .jobfit-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sticky navbar with brand and theme switcher. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(18px)',
          background: dark ? 'rgba(5,5,8,0.74)' : 'rgba(247,247,252,0.78)',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div
          className="jobfit-shell"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '16px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                boxShadow: '0 12px 28px rgba(124,58,237,0.28)',
              }}
            >
              <Zap size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>JobFit Analyzer</div>
              <div style={{ fontSize: 13, color: theme.muted }}>Resume intelligence for faster applications</div>
            </div>
          </div>
          <ThemeToggle dark={dark} setDark={setDark} />
        </div>
      </div>

      <div className="jobfit-shell" style={{ padding: '28px 0 48px' }}>
        {/* Hero section with headline and feature highlights. */}
        <MotionSection
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{
            padding: '26px 0 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 'min(880px, 100%)',
              margin: '0 auto',
              padding: '28px 22px',
              borderRadius: 28,
              background: dark
                ? 'radial-gradient(circle at top, rgba(124,58,237,0.2), rgba(0,200,150,0.05) 45%, rgba(255,255,255,0.02) 100%)'
                : 'radial-gradient(circle at top, rgba(124,58,237,0.14), rgba(0,200,150,0.05) 45%, #ffffff 100%)',
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(34px, 7vw, 68px)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.05em',
                background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Upload Once. Get Hired Faster.
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 16,
                lineHeight: 1.8,
                color: theme.muted,
                maxWidth: 720,
                marginInline: 'auto',
              }}
            >
              Drop in your resume, optionally add a job description, and get a polished analysis covering resume quality,
              ATS compatibility, keyword gaps, platform targeting, and instant next steps.
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 22,
              }}
            >
              {featurePills.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <Icon size={14} color={themeMap.accent} />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </MotionSection>

        {/* Error banner for API or file validation problems. */}
        <AnimatePresence>
          {error && (
            <MotionDiv
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: 18,
                padding: '14px 16px',
                borderRadius: 18,
                background: 'rgba(255,77,109,0.12)',
                border: `1px solid rgba(255,77,109,0.25)`,
                color: theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <X size={16} color={themeMap.danger} />
              <span>{error}</span>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Upload section shown until results are available. */}
        <AnimatePresence mode="wait">
          {!results && !loading && (
            <motion.section
              key="upload-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 28,
                padding: 22,
                display: 'grid',
                gap: 18,
                backdropFilter: 'blur(18px)',
              }}
            >
              {/* Drag-and-drop upload box for the resume file. */}
              <div
                {...getRootProps()}
                style={{
                  borderRadius: 24,
                  border: `1.5px dashed ${isDragActive ? themeMap.accent : theme.border}`,
                  background: isDragActive
                    ? dark
                      ? 'rgba(124,58,237,0.12)'
                      : 'rgba(124,58,237,0.08)'
                    : dark
                      ? 'rgba(255,255,255,0.02)'
                      : '#fbfbff',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: isDragActive ? '0 0 0 4px rgba(124,58,237,0.14)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <input {...getInputProps()} />
                <div
                  style={{
                    width: 62,
                    height: 62,
                    margin: '0 auto 14px',
                    borderRadius: 20,
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
                  }}
                >
                  <Upload size={26} color="#fff" />
                </div>
                <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </div>
                <div style={{ marginTop: 8, color: theme.muted, fontSize: 14 }}>PDF and DOCX files are supported</div>
                {file && (
                  <div
                    style={{
                      marginTop: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: 'rgba(0,200,150,0.12)',
                      border: `1px solid rgba(0,200,150,0.28)`,
                      color: theme.text,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle size={16} color={themeMap.mint} />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              {/* Optional job description textarea for JD matching. */}
              <div>
                <label
                  htmlFor="jd-text"
                  style={{
                    display: 'block',
                    marginBottom: 10,
                    color: theme.muted,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                  }}
                >
                  JOB DESCRIPTION OPTIONAL
                </label>
                <textarea
                  id="jd-text"
                  value={jdText}
                  onChange={(event) => setJdText(event.target.value)}
                  placeholder="Paste the role details here for keyword and JD match scoring..."
                  style={{
                    width: '100%',
                    minHeight: 150,
                    resize: 'vertical',
                    borderRadius: 20,
                    border: `1px solid ${theme.border}`,
                    background: dark ? 'rgba(255,255,255,0.02)' : '#fcfcff',
                    color: theme.text,
                    padding: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Platform selection buttons with selectable toggle behavior. */}
              <div>
                <div style={{ color: theme.text, fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Choose platform</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 12,
                  }}
                >
                  {platforms.map((item) => {
                    const active = platform === item.key

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPlatform((current) => (current === item.key ? null : item.key))}
                        style={{
                          borderRadius: 18,
                          border: `1px solid ${active ? themeMap.accent : theme.border}`,
                          background: active ? 'rgba(124,58,237,0.14)' : theme.card,
                          color: theme.text,
                          padding: '14px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Briefcase size={16} color={active ? themeMap.accent : theme.muted} />
                          <span style={{ fontWeight: 700 }}>{item.emoji} {item.label}</span>
                        </span>
                        {active && <CheckCircle size={16} color={themeMap.mint} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Optional target role selector used for backend analysis context. */}
              <div>
                <label
                  htmlFor="role-select"
                  style={{
                    display: 'block',
                    marginBottom: 10,
                    color: theme.muted,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                  }}
                >
                  TARGET ROLE (Optional)
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  style={{
                    width: '100%',
                    background: dark ? 'rgba(255,255,255,0.02)' : theme.card,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Select your target role</option>
                  <option value="Developer">Developer</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Designer">Designer</option>
                  <option value="Marketing">Marketing</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Primary analyze action shown only after a file is chosen. */}
              {file && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: 20,
                    padding: '16px 18px',
                    background: `linear-gradient(135deg, ${themeMap.accent}, #9f67ff 45%, ${themeMap.mint})`,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 20px 40px rgba(124,58,237,0.28)',
                  }}
                >
                  Analyze Resume
                </button>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Loading state with animated rings and rotating status messages. */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.section
              key="loading-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              style={{
                marginTop: 8,
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 28,
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  margin: '0 auto 18px',
                  position: 'relative',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `4px solid transparent`,
                    borderTopColor: themeMap.accent,
                    borderRightColor: themeMap.accent,
                  }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    inset: 14,
                    borderRadius: '50%',
                    border: `4px solid transparent`,
                    borderBottomColor: themeMap.mint,
                    borderLeftColor: themeMap.mint,
                  }}
                />
              </div>
              <div style={{ color: theme.text, fontSize: 22, fontWeight: 800 }}>Analyzing your resume</div>
              <div style={{ marginTop: 10, color: theme.muted, fontSize: 15 }}>{loadingMessages[loadingIndex]}</div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results dashboard with animated scorecards and detailed analysis. */}
        <AnimatePresence mode="wait">
          {results && !loading && (
            <motion.section
              key="results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              style={{ display: 'grid', gap: 18 }}
            >
              {/* Responsive score ring grid for the top metrics. */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: jdScore !== null ? 'repeat(3, minmax(0,1fr))' : 'repeat(2, minmax(0,1fr))',
              gap: 18
            }}>
              <ScoreRing score={resumeScore} max={100} dark={dark} label="Resume Score" />
              <ScoreRing score={atsScore} max={100} dark={dark} label="ATS Score" />
                {jdScore !== null && <ScoreRing score={jdScore} max={100} dark={dark} label="JD Match" />}
            </div>

              {/* Mid-page metrics split between ATS meter and section pills. */}
              <div className="jobfit-main-grid">
                <ATSMeter score={atsScore} dark={dark} />

                <div
                  style={{
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 24,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>Section Analysis</div>
                    <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>
                      Green means present. Red marks sections that should be added or strengthened.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(results?.score_data?.found_sections || []).map((section) => (
                      <Pill key={`found-${section}`} label={section} present dark={dark} />
                    ))}
                    {(results?.score_data?.missing_sections || []).map((section) => (
                      <Pill key={`missing-${section}`} label={section} present={false} dark={dark} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Missing JD keywords rendered as warning chips when JD data exists. */}
              {jdScore !== null && (
                <div
                  style={{
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 24,
                    padding: 24,
                  }}
                >
                  <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>Missing Keywords</div>
                  <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>
                    Add these keywords naturally if they match your real experience.
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                    {(results?.jd_match?.missing_keywords || []).length > 0 ? (
                      results.jd_match.missing_keywords.map((keyword) => (
                        <div
                          key={keyword}
                          style={{
                            padding: '9px 13px',
                            borderRadius: 999,
                            background: 'rgba(245,166,35,0.12)',
                            border: `1px solid rgba(245,166,35,0.24)`,
                            color: theme.text,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          + {keyword}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: theme.muted, fontSize: 14 }}>No missing keywords were detected.</div>
                    )}
                  </div>
                </div>
              )}
{/* AI Feedback card — Rich structured analysis */}
<div style={{
  background: theme.card,
  border: `1px solid ${theme.border}`,
  borderRadius: 24,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}}>
  <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>
    🧠 AI Resume Analysis
  </div>
  <div style={{
    background: dark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 12,
    padding: '10px 14px',
    color: dark ? '#aaa' : '#666',
    fontSize: 13,
  }}>
    Powered by Gemini 2.0 Flash — Recruiter + ATS + Career Coach simulation
  </div>
  {feedbackPoints.length > 0 ? (
    feedbackPoints.map((point, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 14,
          background: dark ? 'rgba(255,255,255,0.02)' : '#fafafe',
          border: `1px solid ${theme.border}`,
        }}
      >
        <span style={{
          width: 10, height: 10,
          borderRadius: '50%',
          background: themeMap.accent,
          marginTop: 6, flexShrink: 0,
        }} />
        <span style={{
          color: theme.text,
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap'
        }}>
          {point}
        </span>
      </motion.div>
    ))
  ) : (
    <div style={{ color: theme.muted, fontSize: 14 }}>
      No AI analysis returned yet.
    </div>
  )}
</div>

              {/* Action buttons for download and reset. */}
              {/* ── FORMAT SELECTOR ── */}
<div style={{
  background: theme.card,
  border: `1px solid ${theme.border}`,
  borderRadius: 24,
  padding: 24,
}}>
  <div style={{ color: theme.text, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
    Choose Resume Format
  </div>
  <div style={{ color: theme.muted, fontSize: 14, marginBottom: 18 }}>
    Select the platform format for your downloaded resume. Each format is optimized for that portal's ATS.
  </div>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14
  }}>
    {[
      {
        id: 'linkedin',
        emoji: '💼',
        label: 'LinkedIn',
        color: '#0077b5',
        desc: 'Professional summary first, headline focused, achievement-oriented bullet points'
      },
      {
        id: 'naukri',
        emoji: '🔶',
        label: 'Naukri',
        color: '#ff7555',
        desc: 'Skills and career objective first, keyword-rich, ATS-optimized for Indian recruiters'
      },
      {
        id: 'internshala',
        emoji: '🎓',
        label: 'Internshala',
        color: '#1bca8c',
        desc: 'Education and projects first, fresher-friendly, internship-focused structure'
      },
      {
        id: 'general',
        emoji: '📄',
        label: 'General ATS',
        color: '#7c3aed',
        desc: 'Clean single-column format, works for any ATS system or job portal'
      }
    ].map(fmt => (
      <button
        key={fmt.id}
        type="button"
        onClick={() => setSelectedFormat(fmt.id)}
        style={{
          borderRadius: 18,
          border: selectedFormat === fmt.id
            ? `2px solid ${fmt.color}`
            : `1px solid ${theme.border}`,
          background: selectedFormat === fmt.id
            ? `${fmt.color}18`
            : theme.card,
          padding: '16px 14px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}>{fmt.emoji}</div>
        <div style={{
          color: selectedFormat === fmt.id ? fmt.color : theme.text,
          fontSize: 15,
          fontWeight: 800,
          marginBottom: 6
        }}>
          {fmt.label}
        </div>
        <div style={{ color: theme.muted, fontSize: 12, lineHeight: 1.5 }}>
          {fmt.desc}
        </div>
        {selectedFormat === fmt.id && (
          <div style={{
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: fmt.color,
            fontWeight: 700
          }}>
            <CheckCircle size={12} /> Selected
          </div>
        )}
      </button>
    ))}
  </div>
</div>

{/* ── LIVE RESUME EDITOR ── */}
<div style={{
  background: theme.card,
  border: `1px solid ${theme.border}`,
  borderRadius: 24,
  padding: 24,
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14
  }}>
    <div>
      <div style={{ color: theme.text, fontSize: 18, fontWeight: 800 }}>
        Live Resume Editor
      </div>
      <div style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
        This is your AI-optimized resume. Edit directly, then download with your chosen format above.
      </div>
    </div>
    <button
      type="button"
      onClick={() => setShowEditor(prev => !prev)}
      style={{
        background: showEditor ? 'rgba(124,58,237,0.15)' : theme.card,
        border: `1px solid ${showEditor ? themeMap.accent : theme.border}`,
        borderRadius: 12,
        padding: '8px 16px',
        color: showEditor ? themeMap.accent : theme.text,
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s'
      }}
    >
      {showEditor ? 'Hide Editor' : 'Open Editor'}
    </button>
  </div>

  <AnimatePresence>
    {showEditor && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Editor toolbar */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setEditedResume(results.optimized_text || results.extracted_text || '')}
            style={{
              background: 'rgba(0,200,150,0.12)',
              border: '1px solid rgba(0,200,150,0.3)',
              borderRadius: 8,
              padding: '6px 14px',
              color: themeMap.mint,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Reset to AI Version
          </button>
          <button
            type="button"
            onClick={() => setEditedResume(results.extracted_text || '')}
            style={{
              background: 'rgba(245,166,35,0.12)',
              border: '1px solid rgba(245,166,35,0.3)',
              borderRadius: 8,
              padding: '6px 14px',
              color: themeMap.warning,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Reset to Original
          </button>
          <div style={{
            marginLeft: 'auto',
            color: theme.muted,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center'
          }}>
            {editedResume.length} characters
          </div>
        </div>

        {/* Actual editor */}
        <textarea
          value={editedResume}
          onChange={e => setEditedResume(e.target.value)}
          style={{
            width: '100%',
            minHeight: 420,
            resize: 'vertical',
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            background: dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
            color: theme.text,
            padding: '16px',
            fontSize: 13,
            lineHeight: 1.8,
            fontFamily: 'Consolas, "Courier New", monospace',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = themeMap.accent}
          onBlur={e => e.target.style.borderColor = theme.border}
          placeholder="Your AI-optimized resume will appear here for editing..."
          spellCheck={true}
        />

        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          background: dark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 10,
          color: theme.muted,
          fontSize: 12,
          lineHeight: 1.6
        }}>
          Tip: Edit this text to add your own changes, then click Download Resume below to get the final formatted DOCX in your chosen format.
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

{/* ── ACTION BUTTONS ── */}
<div className="jobfit-actions">
  <button
    type="button"
    onClick={handleDownload}
    disabled={downloadLoading}
    style={{
      border: 'none',
      borderRadius: 20,
      padding: '16px 18px',
      background: `linear-gradient(135deg, ${themeMap.accent}, ${themeMap.mint})`,
      color: '#fff',
      cursor: downloadLoading ? 'not-allowed' : 'pointer',
      opacity: downloadLoading ? 0.7 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 15,
      fontWeight: 800,
    }}
  >
    <Download size={18} />
    <span>
      {downloadLoading
        ? 'Generating...'
        : `Download ${
            selectedFormat === 'linkedin' ? 'LinkedIn' :
            selectedFormat === 'naukri' ? 'Naukri' :
            selectedFormat === 'internshala' ? 'Internshala' :
            'General ATS'
          } Resume`
      }
    </span>
  </button>

  <button
    type="button"
    onClick={handleReset}
    style={{
      borderRadius: 20,
      padding: '16px 18px',
      background: theme.card,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 15,
      fontWeight: 800,
    }}
  >
    <RotateCcw size={18} />
    <span>Analyze Another</span>
  </button>
</div>

{/* Download success message */}
<AnimatePresence>
  {downloadSuccess && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        padding: '14px 16px',
        borderRadius: 18,
        background: 'rgba(0,200,150,0.12)',
        border: '1px solid rgba(0,200,150,0.24)',
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <CheckCircle size={16} color={themeMap.mint} />
      <span>Download complete. Your optimized resume has been saved.</span>
    </motion.div>
  )}
</AnimatePresence>

              {/* Collapsed extracted text section for debugging and transparency. */}
              <details
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 24,
                  padding: 20,
                }}
              >
                <summary style={{ cursor: 'pointer', color: theme.text, fontSize: 16, fontWeight: 800 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={16} color={themeMap.accent} />
                    <span>View Extracted Text</span>
                  </span>
                </summary>
                <pre
                  style={{
                    margin: '16px 0 0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: theme.muted,
                    fontSize: 13,
                    lineHeight: 1.75,
                    fontFamily: 'Consolas, monospace',
                  }}
                >
                  {results?.extracted_text || 'No extracted text available.'}
                </pre>
              </details>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
