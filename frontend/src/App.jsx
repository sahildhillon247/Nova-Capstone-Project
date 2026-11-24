import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('placement-prep-token') || ''}`
})

async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Request failed')
  return result.data
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
}

function EyeIcon({ visible }) {
  return visible
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.9A11 11 0 0 1 12 7c6.3 0 9.5 5 9.5 5a16.7 16.7 0 0 1-3.1 3.2M6.5 6.7C3.9 8.1 2.5 12 2.5 12s3.2 5 9.5 5c1.2 0 2.3-.2 3.2-.5" /></svg>
}

function NovaLogo() {
  return <div className="nova-logo"><span>✦</span><strong>NOVA</strong></div>
}

const topics = [
  { name: 'Arrays', value: 80, color: 'purple' },
  { name: 'Trees', value: 60, color: 'blue' },
  { name: 'Graphs', value: 40, color: 'green' },
  { name: 'Dynamic Programming', value: 30, color: 'orange' },
]

function DashboardHome({ onNavigate, userName }) {
  const firstName = userName?.trim().split(/\s+/)[0] || 'User'
  const initial = firstName.charAt(0).toUpperCase()
  const [dashboard, setDashboard] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    apiGet('/dashboard').then(setDashboard).catch(() => setDashboard(null))
  }, [])

  const overview = dashboard?.overview
  const topicProgress = dashboard?.topicProgress?.length ? dashboard.topicProgress : topics
  const weakAreas = dashboard?.weakAreas?.length ? dashboard.weakAreas : [
    { topicName: 'Graphs' }, { topicName: 'DP' }, { topicName: 'Trees' }
  ]

  return (
    <>
      <header className="dashboard-header">
        <div><h1>Welcome back, {firstName}!</h1><p>Keep going! You&apos;re doing great.</p></div>
        <div className="header-actions"><button className="icon-button" aria-label="Notifications" onClick={() => setShowNotifications((visible) => !visible)}>♧</button>{showNotifications && <div className="notification-popover">You have 3 weak topics to practice.</div>}<div className="avatar" title={userName}>{initial}</div></div>
      </header>
      <div className="stats-grid">
        <button type="button" className="stat-card stat-total" onClick={() => onNavigate('problems')}><span className="stat-icon">✓</span><div><small>Total Problems</small><strong>{overview?.totalProblems ?? 150}</strong></div></button>
        <button type="button" className="stat-card stat-solved" onClick={() => onNavigate('problems')}><span className="stat-icon">✓</span><div><small>Solved</small><strong>{overview?.solvedProblems ?? 48}</strong></div></button>
        <button type="button" className="stat-card stat-progress" onClick={() => onNavigate('progress')}><span className="stat-icon">▥</span><div><small>Progress</small><strong>{overview?.completionPercentage ?? 32}%</strong></div></button>
      </div>
      <div className="dashboard-grid">
        <section className="panel topic-panel">
          <div className="panel-heading"><h2>Topic Progress</h2><button onClick={() => onNavigate('progress')}>View All →</button></div>
          <div className="topic-list">{topicProgress.slice(0, 4).map((topic, index) => {
            const name = topic.topicName || topic.name
            const value = topic.completionPercentage ?? topic.value
            const color = ['purple', 'blue', 'green', 'orange'][index]
            return <button type="button" className="topic-row topic-row-button" key={name} onClick={() => onNavigate('problems', name)}><div><span>{name}</span><b>{value}%</b></div><div className="progress-track"><i className={color} style={{ width: `${value}%` }} /></div></button>
          })}</div>
        </section>
        <section className="panel weak-panel">
          <div className="panel-heading"><h2><span className="warning">!</span> Weak Areas</h2></div>
          <ul className="weak-list">{weakAreas.slice(0, 3).map((area, index) => <li key={area.topicName || area.topicId}><button type="button" onClick={() => onNavigate('problems', area.topicName === 'Dynamic Programming' ? 'Dynamic Programming' : area.topicName)}><i className={['orange-dot', 'purple-dot', 'pink-dot'][index]} />{area.topicName === 'Dynamic Programming' ? 'DP' : area.topicName}</button></li>)}</ul>
          <button className="practice-button" onClick={() => onNavigate('problems', weakAreas[0]?.topicName || 'Graphs')}>Practice Weak Areas <span>→</span></button>
        </section>
      </div>
    </>
  )
}

function ProblemsPage({ initialTopic = '' }) {
  const [problems, setProblems] = useState([])
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState(initialTopic)
  const [difficulty, setDifficulty] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProblemId, setSavingProblemId] = useState(null)

  useEffect(() => {
    let active = true
    async function loadProblems() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (topic) params.set('topic', topic)
        if (difficulty) params.set('difficulty', difficulty)
        const data = await apiGet(`/problems${params.toString() ? `?${params}` : ''}`)
        if (active) setProblems(data.problems || [])
      } catch (error) {
        if (active) setMessage(error.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadProblems()
    return () => { active = false }
  }, [search, topic, difficulty])

  async function markSolved(problemId) {
    setSavingProblemId(problemId)
    try {
      const response = await fetch(`${API_URL}/progress/${problemId}`, {
        method: 'PATCH',
        headers: authHeaders()
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to update progress')
      setProblems((current) => current.map((problem) => problem.id === problemId ? { ...problem, solved: true } : problem))
      setMessage('Problem marked as solved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSavingProblemId(null)
    }
  }

  return (
    <section className="page-section">
      <div className="page-title"><div><h1>Problems</h1><p>Build your skills one problem at a time.</p></div><button className="primary-small" onClick={() => setMessage('Problems can be managed from the curated problem library.')}>＋ Add Problem</button></div>
      <div className="filter-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="⌕  Search problems..." /><select className="filter-button" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="">All Topics</option><option value="Arrays">Arrays</option><option value="Trees">Trees</option><option value="Graphs">Graphs</option><option value="Dynamic Programming">DP</option><option value="Stacks">Stacks</option></select><select className="filter-button" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">All Difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div>
      {message && <p className="action-message" role="status">{message}</p>}
      <div className="problem-table panel"><div className="table-head"><span>Problem</span><span>Topic</span><span>Difficulty</span><span>Status</span></div>
        {loading && <p className="table-message">Loading problems…</p>}
        {!loading && !problems.length && <p className="table-message">No problems match these filters.</p>}
        {!loading && problems.map((problem) => <div className="table-row" key={problem.id}><strong><a href={problem.problemUrl} target="_blank" rel="noreferrer">{problem.title}</a></strong><span>{problem.topics?.[0]?.topic?.name || 'General'}</span><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty.charAt(0) + problem.difficulty.slice(1).toLowerCase()}</span>{problem.solved ? <span className="solved-status">✓ Solved</span> : <button className="mark-solved" disabled={savingProblemId === problem.id} onClick={() => markSolved(problem.id)}>{savingProblemId === problem.id ? 'Saving…' : '○ Mark solved'}</button>}</div>)}
      </div>
    </section>
  )
}

function ProgressPage({ onNavigate }) {
  const [progressData, setProgressData] = useState(null)
  useEffect(() => {
    apiGet('/dashboard').then(setProgressData).catch(() => setProgressData(null))
  }, [])
  const overview = progressData?.overview
  const topicProgress = progressData?.topicProgress?.length ? progressData.topicProgress : topics

  return (
    <section className="page-section">
      <div className="page-title"><div><h1>Your Progress</h1><p>See how far you&apos;ve come and where to go next.</p></div></div>
      <div className="progress-overview panel"><div className="ring"><strong>{overview?.completionPercentage ?? 32}%</strong><span>complete</span></div><div><h2>Great momentum!</h2><p>You&apos;ve solved <b>{overview?.solvedProblems ?? 48}</b> out of {overview?.totalProblems ?? 150} curated problems.</p><button className="practice-button" onClick={() => onNavigate('problems')}>Keep practicing <span>→</span></button></div></div>
      <section className="panel full-topic-panel"><div className="panel-heading"><h2>Progress by topic</h2></div><div className="topic-list">{topicProgress.map((topic, index) => {
        const name = topic.topicName || topic.name
        const value = topic.completionPercentage ?? topic.value
        return <button type="button" className="topic-row topic-row-button" key={name} onClick={() => onNavigate('problems', name)}><div><span>{name}</span><b>{value}%</b></div><div className="progress-track"><i className={['purple', 'blue', 'green', 'orange'][index % 4]} style={{ width: `${value}%` }} /></div></button>
      })}</div></section>
    </section>
  )
}

function SettingsPage() {
  const [name, setName] = useState(localStorage.getItem('nova-name') || 'Alex Johnson')
  const [email, setEmail] = useState(localStorage.getItem('nova-email') || 'alex@example.com')
  const [reminders, setReminders] = useState(true)
  const [saved, setSaved] = useState(false)

  return (
    <section className="page-section">
      <div className="page-title"><div><h1>Settings</h1><p>Manage your account and preferences.</p></div></div>
      <section className="settings-card panel"><h2>Profile information</h2><label>Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label><button className="primary-small" onClick={() => { localStorage.setItem('nova-name', name); localStorage.setItem('nova-email', email); setSaved(true); setTimeout(() => setSaved(false), 2500) }}>{saved ? 'Saved ✓' : 'Save changes'}</button></section>
      <section className="settings-card panel"><h2>Preferences</h2><label className="setting-toggle"><span><b>Email reminders</b><small>Get a reminder to keep your streak going.</small></span><input type="checkbox" checked={reminders} onChange={(event) => setReminders(event.target.checked)} /></label></section>
    </section>
  )
}

function Dashboard({ onLogout, userName }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [problemTopic, setProblemTopic] = useState('')
  function navigate(page, topic = '') {
    setActivePage(page)
    if (page === 'problems') setProblemTopic(topic)
  }
  const page = activePage === 'problems'
    ? <ProblemsPage key={problemTopic || 'all'} initialTopic={problemTopic} />
    : activePage === 'progress'
      ? <ProgressPage onNavigate={navigate} />
      : activePage === 'settings'
        ? <SettingsPage />
        : <DashboardHome onNavigate={navigate} userName={userName} />

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <NovaLogo />
        <nav><button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><span>⌂</span>Dashboard</button><button className={activePage === 'problems' ? 'active' : ''} onClick={() => navigate('problems')}><span>☷</span>Problems</button><button className={activePage === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}><span>▥</span>Progress</button><button className={activePage === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><span>⚙</span>Settings</button></nav>
        <button className="logout-button" onClick={onLogout}><span>⇥</span>Logout</button>
      </aside>
      <div className="dashboard-main">{page}</div>
    </main>
  )
}

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/auth/${isSignUp ? 'signup' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isSignUp ? form : { email: form.email, password: form.password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to complete your request.')
      if (result.data?.token) localStorage.setItem('placement-prep-token', result.data.token)
      onLogin(result.data?.user?.name || form.name || 'Alex')
    } catch (error) {
      setStatus({ type: 'error', message: error.message === 'Failed to fetch' ? 'The API is unavailable. Please start the backend server.' : error.message || 'The server is unavailable.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual"><div className="left-copy"><div className="nova-brand"><span className="nova-symbol">N</span><strong>NOVA</strong></div><p className="nova-tagline">Learn • Practice • Ace</p><h2>Your Placement<br />Preparation Partner</h2><p className="nova-description">Track your progress, solve problems,<br />and build your dream career.</p></div></section>
      <section className="login-side"><div className="login-card"><div className="mobile-logo"><span className="nova-symbol">N</span><strong>NOVA</strong></div><header className="login-heading"><h1>{isSignUp ? 'Create Account!' : 'Welcome Back!'}</h1><p>{isSignUp ? 'Start your placement journey today' : 'Sign in to continue your journey'}</p></header>
        <form onSubmit={handleSubmit}>{isSignUp && <label className="input-wrap"><span className="field-icon">N</span><input name="name" type="text" autoComplete="name" placeholder="Full Name" value={form.name} onChange={updateField} required /></label>}<label className="input-wrap"><MailIcon /><input name="email" type="email" autoComplete="email" placeholder="Email Address" value={form.email} onChange={updateField} required /></label><label className="input-wrap"><LockIcon /><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Password" minLength="8" value={form.password} onChange={updateField} required /><button type="button" className="eye-button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}><EyeIcon visible={showPassword} /></button></label>{status.message && <p className={`form-status ${status.type}`} role="alert">{status.message}</p>}<button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Sign In'}</button></form>
        <div className="divider"><span>or</span></div><button type="button" className="google-button" onClick={() => setStatus({ type: 'error', message: 'Google sign-in is not configured yet.' })}><span className="google-g">G</span>Continue with Google</button><p className="account-prompt">{isSignUp ? 'Already have an account?' : 'Don’t have an account?'}<button type="button" onClick={() => { setIsSignUp((current) => !current); setStatus({ type: '', message: '' }) }}>{isSignUp ? 'Sign In' : 'Sign Up'}</button></p>
      </div></section>
    </main>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [restoring, setRestoring] = useState(() => Boolean(localStorage.getItem('placement-prep-token')))
  useEffect(() => {
    if (!localStorage.getItem('placement-prep-token')) {
      return
    }
    apiGet('/auth/me')
      .then((data) => setUser(data.user.name))
      .catch(() => localStorage.removeItem('placement-prep-token'))
      .finally(() => setRestoring(false))
  }, [])
  if (restoring) return <main className="app-loading" aria-label="Loading NOVA">Loading NOVA…</main>
  return user
    ? <Dashboard userName={user} onLogout={() => { localStorage.removeItem('placement-prep-token'); setUser(null) }} />
    : <Login onLogin={setUser} />
}

export default App
