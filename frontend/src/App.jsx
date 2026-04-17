import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  Moon,
  RefreshCcw,
  Sparkles,
  Sun,
  UploadCloud,
} from 'lucide-react'

const platforms = ['LinkedIn', 'Naukri', 'Internshala']
const allSections = ['Email', 'Phone', 'Education', 'Experience', 'Skills', 'Projects']

const scoreColors = {
  resume: '#7c3aed',
  ats: '#00c896',
  jd: '#f59e0b',
}

const getTheme = (dark) => ({
  dark,
  background: dark ? '#050508' : '#ffffff',
  surface: dark ? 'rgba(13, 13, 19, 0.92)' : 'rgba(255, 255, 255, 0.92)',
  surfaceStrong: dark ? '#0d0d13' : '#ffffff',
  mutedSurface: dark ? 'rgba(124, 58, 237, 0.09)' : '#f8f5ff',
  border: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
  text: dark ? '#f8fafc' : '#0f172a',
  textSoft: dark ? '#cbd5e1' : '#475569',
  accent: '#7c3aed',
  accentSoft: dark ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.1)',
  mint: '#00c896',
  mintSoft: dark ? 'rgba(0, 200, 150, 0.18)' : 'rgba(0, 200, 150, 0.12)',
  warningSoft: dark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.14)',
  dangerSoft: dark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 226, 226, 0.95)',
  ringTrack: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.09)',
  shadow: dark ? '0 24px 80px rgba(2, 6, 23, 0.45)' : '0 24px 70px rgba(148, 163, 184, 0.22)',
})

const parseFeedback = (feedback) => {
  if (!feedback) return []

  const cleaned = feedback
    .replace(/â€¢/g, '•')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•*\-\d.)\s]+/, '').trim())
    .filter(Boolean)

  return cleaned.length ? cleaned : [feedback]
}

const buildAtsScore = (issues = []) => Math.max(100 - issues.length * 20, 0)

const getMeterStatus = (score) => {
  if (score >= 75) return 'Pass'
  if (score >= 45) return 'Review'
  return 'Reject'
}

function AnimatedNumber({ value, color, theme }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frameId
    let startTime
    const duration = 900

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frameId)
  }, [value])

  return (
    <motion.span
      key={value}
      initial={{ scale: 0.8, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ color, fontSize: '1.9rem', fontWeight: 800, lineHeight: 1 }}
    >
      {displayValue}
      <span style={{ color: theme.textSoft, fontSize: '0.95rem', fontWeight: 600 }}>/100</span>
    </motion.span>
  )
}

function ScoreRing({ label, value, color, theme }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeValue / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '1.5rem',
        padding: '1.35rem',
        boxShadow: theme.shadow,
        backdropFilter: 'blur(14px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ margin: 0, color: theme.text, fontWeight: 700 }}>{label}</p>
        <Sparkles size={16} color={color} />
      </div>

      <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke={theme.ringTrack} strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            strokeDasharray={circumference}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'grid', placeItems: 'center' }}>
          <AnimatedNumber value={safeValue} color={color} theme={theme} />
        </div>
      </div>
    </motion.div>
  )
}

function App() {
  const MotionDiv = motion.div

  // Theme, upload, and analysis state.
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [dark, setDark] = useState(true)
  const [jdText, setJdText] = useState('')
  const [platform, setPlatform] = useState('LinkedIn')

  const theme = useMemo(() => getTheme(dark), [dark])

  // Derived metrics used across the results area.
  const atsScore = useMemo(() => buildAtsScore(results?.ats_issues ?? []), [results])
  const jdScore = results?.jd_match?.match_score
  const feedbackPoints = useMemo(() => parseFeedback(results?.ai_feedback), [results])
  const sectionStatus = useMemo(
    () =>
      allSections.map((section) => ({
        label: section,
        found: results?.score_data?.found_sections?.includes(section) ?? false,
      })),
    [results],
  )

  // Keep the page colors aligned with the active theme.
  useEffect(() => {
    document.body.style.background = theme.background
    document.body.style.color = theme.text
    document.body.style.transition = 'background 250ms ease, color 250ms ease'
  }, [theme])

  // Resume dropzone configuration.
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length) setFile(acceptedFiles[0])
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  })

  // Submit the file, JD, and selected platform to the backend.
  const handleAnalyze = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('jd_text', jdText)
    formData.append('platform', platform.toLowerCase())

    try {
      setLoading(true)
      const response = await axios.post('http://localhost:8000/upload', formData)
      setResults(response.data)
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Unable to analyze the resume right now.'

      setResults({
        score_data: { total_score: 0, found_sections: [], missing_sections: allSections },
        ats_issues: [typeof message === 'string' ? message : 'Unexpected server response'],
        jd_match: { match_score: jdText.trim() ? 0 : null, missing_keywords: [], jd_keywords: [] },
        ai_feedback: 'Analysis could not be completed. Please check that the backend is running on http://localhost:8000.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Download the optimized resume returned by the backend.
  const handleDownload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('jd_text', jdText)
    formData.append('platform', platform.toLowerCase())

    try {
      const response = await axios.post('http://localhost:8000/download', formData, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `optimized_resume_${platform.toLowerCase()}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      window.alert('Download failed. Please make sure the backend is available.')
    }
  }

  // Reset the experience to analyze another resume.
  const handleReset = () => {
    setFile(null)
    setLoading(false)
    setResults(null)
    setJdText('')
    setPlatform('LinkedIn')
  }

  const meterStatus = getMeterStatus(atsScore)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        button, input, textarea { font: inherit; }
        .app-shell {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .app-shell::before,
        .app-shell::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          filter: blur(90px);
          z-index: 0;
          pointer-events: none;
        }
        .app-shell::before {
          width: 18rem;
          height: 18rem;
          top: 5rem;
          left: -4rem;
          background: rgba(124, 58, 237, 0.25);
        }
        .app-shell::after {
          width: 20rem;
          height: 20rem;
          top: 18rem;
          right: -6rem;
          background: rgba(0, 200, 150, 0.18);
        }
        .content-wrap {
          width: min(1160px, calc(100% - 2rem));
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .toggle-button:hover { transform: translateY(-1px); }
        .ghost-input::file-selector-button { display: none; }
        .gradient-text {
          background: linear-gradient(120deg, #7c3aed 0%, #00c896 45%, #f8fafc 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .light-gradient-text {
          background: linear-gradient(120deg, #7c3aed 0%, #00c896 50%, #111827 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        @media (max-width: 768px) {
          .content-wrap { width: min(100% - 1rem, 1160px); }
        }
      `}</style>

      <div className="app-shell" style={{ background: theme.background }}>
        {/* Sticky navbar with logo and theme toggle. */}
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backdropFilter: 'blur(18px)',
            borderBottom: `1px solid ${theme.border}`,
            background: dark ? 'rgba(5, 5, 8, 0.74)' : 'rgba(255, 255, 255, 0.76)',
          }}
        >
          <div
            className="content-wrap"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <MotionDiv
                whileHover={{ rotate: -6, scale: 1.04 }}
                style={{
                  width: '2.9rem',
                  height: '2.9rem',
                  borderRadius: '1rem',
                  display: 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.mint})`,
                  color: '#fff',
                  boxShadow: '0 16px 32px rgba(124, 58, 237, 0.3)',
                }}
              >
                <FileText size={20} />
              </MotionDiv>
              <div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: theme.text }}>JobFit Analyzer</p>
                <p style={{ margin: 0, color: theme.textSoft, fontSize: '0.88rem' }}>
                  Resume scoring with ATS and JD insights
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Toggle theme"
              className="toggle-button"
              onClick={() => setDark((value) => !value)}
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.surfaceStrong,
                borderRadius: '999px',
                padding: '0.35rem',
                width: '4.9rem',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 180ms ease',
                boxShadow: theme.shadow,
              }}
            >
              <div
                style={{
                  height: '2.15rem',
                  borderRadius: '999px',
                  background: dark
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.32), rgba(0,200,150,0.22))'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(0,200,150,0.12))',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  style={{
                    width: '1.8rem',
                    height: '1.8rem',
                    borderRadius: '999px',
                    background: '#fff',
                    position: 'absolute',
                    top: '0.175rem',
                    left: dark ? '2.8rem' : '0.18rem',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.18)',
                  }}
                >
                  {dark ? <Moon size={14} color={theme.accent} /> : <Sun size={14} color={theme.mint} />}
                </motion.div>
              </div>
            </button>
          </div>
        </motion.nav>

        <main className="content-wrap" style={{ paddingTop: '2.2rem', paddingBottom: '4rem' }}>
          {/* Hero section with gradient headline and intro copy. */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{
              textAlign: 'center',
              padding: '2rem 0 2.5rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.45 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '999px',
                background: theme.accentSoft,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                marginBottom: '1.4rem',
              }}
            >
              <Sparkles size={16} color={theme.accent} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Smarter resume checks for every platform</span>
            </motion.div>

            <h1
              className={dark ? 'gradient-text' : 'light-gradient-text'}
              style={{
                margin: '0 auto',
                maxWidth: '12ch',
                fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.05em',
                fontWeight: 900,
              }}
            >
              Upload Once. Get Hired Faster.
            </h1>

            <p
              style={{
                margin: '1.25rem auto 0',
                maxWidth: '44rem',
                color: theme.textSoft,
                fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                lineHeight: 1.75,
              }}
            >
              Drop in your resume, add a job description if you want deeper matching, choose where you&apos;re applying,
              and get a polished breakdown of score, ATS health, keywords, and AI suggestions.
            </p>
          </motion.section>

          {/* Main upload and input area. */}
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            style={{
              display: 'grid',
              gap: '1.25rem',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '1.75rem',
              padding: 'clamp(1rem, 3vw, 1.6rem)',
              boxShadow: theme.shadow,
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Drag and drop resume upload box. */}
            <div
              {...getRootProps()}
              style={{
                border: `1.5px dashed ${isDragActive ? theme.mint : theme.border}`,
                borderRadius: '1.4rem',
                padding: 'clamp(1.4rem, 4vw, 2.2rem)',
                background: isDragActive ? theme.mintSoft : theme.mutedSurface,
                transition: 'all 180ms ease',
                cursor: 'pointer',
              }}
            >
              <input {...getInputProps()} className="ghost-input" />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '0.85rem',
                }}
              >
                <motion.div
                  animate={{ y: isDragActive ? -4 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '1.2rem',
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.mint})`,
                    color: '#fff',
                  }}
                >
                  <UploadCloud size={24} />
                </motion.div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, color: theme.text, fontSize: '1.05rem' }}>
                    {file ? file.name : isDragActive ? 'Drop your resume here' : 'Drag and drop your resume'}
                  </p>
                  <p style={{ margin: '0.45rem 0 0', color: theme.textSoft }}>
                    Accepts PDF and DOCX only. Tap or click the box to browse.
                  </p>
                </div>
              </div>
            </div>

            {fileRejections.length > 0 && (
              <div
                style={{
                  borderRadius: '1rem',
                  padding: '0.9rem 1rem',
                  background: theme.dangerSoft,
                  color: theme.text,
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                }}
              >
                Only `.pdf` and `.docx` files are supported.
              </div>
            )}

            {/* Job description text area. */}
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <label htmlFor="jd-text" style={{ color: theme.text, fontWeight: 700 }}>
                Job Description
              </label>
              <textarea
                id="jd-text"
                rows={7}
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                placeholder="Paste the job description here for keyword matching and JD score..."
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: '1.2rem',
                  border: `1px solid ${theme.border}`,
                  background: theme.surfaceStrong,
                  color: theme.text,
                  padding: '1rem 1.1rem',
                  outline: 'none',
                  lineHeight: 1.7,
                }}
              />
            </div>

            {/* Platform selector buttons. */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <p style={{ margin: 0, color: theme.text, fontWeight: 700 }}>Select Platform</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {platforms.map((item) => {
                  const active = platform === item
                  return (
                    <motion.button
                      key={item}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setPlatform(item)}
                      style={{
                        borderRadius: '1rem',
                        border: `1px solid ${active ? theme.accent : theme.border}`,
                        background: active ? theme.accentSoft : theme.surfaceStrong,
                        color: theme.text,
                        fontWeight: 800,
                        padding: '0.95rem 1rem',
                        cursor: 'pointer',
                        boxShadow: active ? '0 14px 30px rgba(124, 58, 237, 0.18)' : 'none',
                      }}
                    >
                      {item}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Analyze action button. */}
            <motion.button
              whileHover={{ y: -2, scale: file && !loading ? 1.01 : 1 }}
              whileTap={{ scale: file && !loading ? 0.99 : 1 }}
              type="button"
              disabled={!file || loading}
              onClick={handleAnalyze}
              style={{
                border: 'none',
                borderRadius: '1.15rem',
                padding: '1rem 1.15rem',
                background: !file || loading
                  ? theme.ringTrack
                  : `linear-gradient(135deg, ${theme.accent}, ${theme.mint})`,
                color: !file || loading ? theme.textSoft : '#ffffff',
                fontWeight: 800,
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.7rem',
              }}
            >
              {loading ? <LoaderCircle size={18} /> : <Sparkles size={18} />}
              {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
            </motion.button>
          </motion.section>

          {/* Results section with animated cards, chips, and actions. */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.section
                key="results"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5 }}
                style={{ marginTop: '1.6rem', display: 'grid', gap: '1.2rem' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, color: theme.text, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>
                      Analysis Results
                    </h2>
                    <p style={{ margin: '0.4rem 0 0', color: theme.textSoft }}>
                      Built for {platform} with ATS checks, keyword gaps, and rewrite guidance.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(${jdScore !== null ? '220px' : '260px'}, 1fr))`,
                    gap: '1rem',
                  }}
                >
                  <ScoreRing
                    label="Resume Score"
                    value={results?.score_data?.total_score ?? 0}
                    color={scoreColors.resume}
                    theme={theme}
                  />
                  <ScoreRing label="ATS Score" value={atsScore} color={scoreColors.ats} theme={theme} />
                  {jdScore !== null && (
                    <ScoreRing
                      label="JD Match Score"
                      value={Math.round(jdScore)}
                      color={scoreColors.jd}
                      theme={theme}
                    />
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* ATS meter with pass/review/reject zones. */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '1.5rem',
                      padding: '1.25rem',
                      boxShadow: theme.shadow,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, color: theme.text, fontWeight: 800 }}>ATS Meter</p>
                        <p style={{ margin: '0.35rem 0 0', color: theme.textSoft }}>
                          Current status: <strong style={{ color: theme.text }}>{meterStatus}</strong>
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '999px',
                          background:
                            meterStatus === 'Pass'
                              ? theme.mintSoft
                              : meterStatus === 'Review'
                                ? theme.warningSoft
                                : theme.dangerSoft,
                          color: theme.text,
                          fontWeight: 800,
                        }}
                      >
                        {meterStatus}
                      </span>
                    </div>

                    <div style={{ marginTop: '1.2rem' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '1rem',
                          overflow: 'hidden',
                          borderRadius: '999px',
                          background: `linear-gradient(90deg,
                            rgba(239,68,68,0.95) 0%,
                            rgba(239,68,68,0.95) 33.33%,
                            rgba(245,158,11,0.95) 33.33%,
                            rgba(245,158,11,0.95) 66.66%,
                            rgba(0,200,150,0.95) 66.66%,
                            rgba(0,200,150,0.95) 100%)`,
                        }}
                      >
                        <motion.div
                          initial={{ left: 0 }}
                          animate={{ left: `calc(${atsScore}% - 10px)` }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            top: '-0.28rem',
                            width: '1.25rem',
                            height: '1.55rem',
                            borderRadius: '999px',
                            background: '#ffffff',
                            border: `3px solid ${theme.background}`,
                            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.22)',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '0.7rem',
                          color: theme.textSoft,
                          fontSize: '0.88rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>Reject</span>
                        <span>Review</span>
                        <span>Pass</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Section analysis pills for found and missing areas. */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '1.5rem',
                      padding: '1.25rem',
                      boxShadow: theme.shadow,
                    }}
                  >
                    <p style={{ margin: 0, color: theme.text, fontWeight: 800 }}>Section Analysis</p>
                    <p style={{ margin: '0.35rem 0 1rem', color: theme.textSoft }}>
                      Green means detected. Red means the section likely needs attention.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                      {sectionStatus.map((section) => (
                        <motion.span
                          key={section.label}
                          whileHover={{ y: -2 }}
                          style={{
                            padding: '0.7rem 0.95rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            background: section.found ? theme.mintSoft : theme.dangerSoft,
                            color: theme.text,
                            border: `1px solid ${section.found ? 'rgba(0,200,150,0.28)' : 'rgba(239,68,68,0.25)'}`,
                          }}
                        >
                          {section.found ? 'Found' : 'Missing'} {section.label}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Missing keywords chip collection when JD is present. */}
                {jdScore !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '1.5rem',
                      padding: '1.25rem',
                      boxShadow: theme.shadow,
                    }}
                  >
                    <p style={{ margin: 0, color: theme.text, fontWeight: 800 }}>Missing Keywords From JD</p>
                    <p style={{ margin: '0.35rem 0 1rem', color: theme.textSoft }}>
                      These terms show up in the job description but were not detected in the resume.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                      {results?.jd_match?.missing_keywords?.length ? (
                        results.jd_match.missing_keywords.map((keyword) => (
                          <span
                            key={keyword}
                            style={{
                              padding: '0.66rem 0.9rem',
                              borderRadius: '999px',
                              background: theme.warningSoft,
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              color: theme.text,
                              fontWeight: 700,
                            }}
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: theme.textSoft }}>No missing JD keywords detected.</span>
                      )}
                    </div>
                  </motion.div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* AI feedback card with bullet points. */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '1.5rem',
                      padding: '1.25rem',
                      boxShadow: theme.shadow,
                    }}
                  >
                    <p style={{ margin: 0, color: theme.text, fontWeight: 800 }}>AI Feedback</p>
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '1.2rem',
                        background: theme.mutedSurface,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: theme.textSoft, lineHeight: 1.8 }}>
                        {feedbackPoints.map((point) => (
                          <li key={point} style={{ marginBottom: '0.55rem' }}>
                            <span style={{ color: theme.text }}>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                  {/* ATS warning cards rendered in red to call out issues. */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.14 }}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '1.5rem',
                      padding: '1.25rem',
                      boxShadow: theme.shadow,
                    }}
                  >
                    <p style={{ margin: 0, color: theme.text, fontWeight: 800 }}>ATS Warnings</p>
                    <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
                      {results?.ats_issues?.length ? (
                        results.ats_issues.map((issue) => (
                          <div
                            key={issue}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.8rem',
                              padding: '0.95rem 1rem',
                              borderRadius: '1.1rem',
                              background: theme.dangerSoft,
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <AlertTriangle size={18} color="#ef4444" style={{ marginTop: '0.12rem', flexShrink: 0 }} />
                            <span style={{ color: theme.text, lineHeight: 1.6 }}>{issue}</span>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.7rem',
                            padding: '0.95rem 1rem',
                            borderRadius: '1.1rem',
                            background: theme.mintSoft,
                            border: '1px solid rgba(0, 200, 150, 0.24)',
                          }}
                        >
                          <CheckCircle2 size={18} color={theme.mint} />
                          <span style={{ color: theme.text }}>No ATS warnings detected. Nice work.</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Result actions for download and reset. */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.9rem',
                    justifyContent: 'flex-start',
                  }}
                >
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleDownload}
                    style={{
                      border: 'none',
                      borderRadius: '1rem',
                      padding: '0.95rem 1.15rem',
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.mint})`,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    <Download size={18} />
                    Download Optimized Resume
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleReset}
                    style={{
                      borderRadius: '1rem',
                      padding: '0.95rem 1.15rem',
                      background: theme.surfaceStrong,
                      color: theme.text,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      fontWeight: 800,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <RefreshCcw size={18} />
                    Analyze Another
                  </motion.button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}

export default App
