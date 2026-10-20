import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const courses = [
  { number: '01', title: 'Reiki', category: 'FORMAÇÃO DE BASE', description: 'Um percurso estruturado para conhecer os fundamentos, desenvolver a prática e integrar a aprendizagem no quotidiano.', status: 'Primeira formação' },
  { number: '02', title: 'Runas', category: 'SABEDORIA SIMBÓLICA', description: 'Explorar os símbolos rúnicos com contexto, método e reflexão.', status: 'Área prevista' },
  { number: '03', title: 'Taças Tibetanas', category: 'SOM E PRESENÇA', description: 'Conhecer o som, a escuta e a prática consciente com taças tibetanas.', status: 'Área prevista' },
];

const navItems = ['Início', 'Escola Online', 'Experiências', 'Eventos', 'O Instituto'];

type AuthMode = 'signin' | 'signup';
type AppUser = { id: string; email?: string };

export default function App() {
  const [activeNav, setActiveNav] = useState('Início');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [user, setUser] = useState<AppUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function openAccount() {
    setAuthError('');
    setAuthMessage('');
    setAuthOpen(true);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!supabase || !isSupabaseConfigured) {
      setAuthError('A ligação ao Supabase ainda não está configurada neste ambiente.');
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          setAuthMessage('Conta criada. A sessão foi iniciada.');
        } else {
          setAuthMessage('Pedido de registo recebido. Verifica o teu email para confirmar a conta antes de iniciar sessão.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setAuthMessage('Sessão iniciada.');
      }
      setPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tenta novamente.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
    else {
      setAuthMessage('Sessão terminada.');
      setAuthError('');
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" onClick={() => setActiveNav('Início')} aria-label="Instituto VibraSer, início">
          <span className="brand-mark" aria-hidden="true"><span>〰</span></span>
          <span className="brand-copy"><strong>VibraSer</strong><small>INSTITUTO · ESCOLA ONLINE</small></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              className={activeNav === item ? 'nav-link active' : 'nav-link'}
              key={item}
              onClick={() => {
                setActiveNav(item);
                const target: Record<string, string> = { 'Início': 'inicio', 'Escola Online': 'escola', 'Experiências': 'experiencias', 'Eventos': 'experiencias', 'O Instituto': 'instituto' };
                document.getElementById(target[item])?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="account-button" onClick={openAccount}>
          {user ? 'A minha conta' : 'Área de aluno'} <span aria-hidden="true">↗</span>
        </button>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-text">
            <p className="eyebrow"><span className="eyebrow-line" /> UM ESPAÇO DE APRENDIZAGEM E PRESENÇA</p>
            <h1>Conhecer.<br /><em>Integrar.</em><br />Transformar.</h1>
            <p className="hero-description">Um caminho de conhecimento, prática e descoberta. Aprende ao teu ritmo, aprofunda a tua experiência e encontra o teu lugar no caminho.</p>
            <div className="hero-actions">
              <button className="button-primary" onClick={() => { setActiveNav('Escola Online'); document.getElementById('escola')?.scrollIntoView({ behavior: 'smooth' }); }}>Explorar formações <span aria-hidden="true">→</span></button>
              <button className="button-text" onClick={() => { setActiveNav('O Instituto'); document.getElementById('instituto')?.scrollIntoView({ behavior: 'smooth' }); }}>Conhecer o Instituto</button>
            </div>
            <div className="hero-note"><span className="note-symbol">✳</span><span>Aprendizagem consciente, ao teu ritmo.</span></div>
          </div>
          <div className="hero-art" aria-label="Composição abstrata de círculos e ondas em lilás e dourado">
            <div className="art-halo halo-one" />
            <div className="art-halo halo-two" />
            <div className="art-ring ring-one" />
            <div className="art-ring ring-two" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-core"><span>V</span><small>VIBRASER</small></div>
            <span className="art-star star-one">✳</span><span className="art-star star-two">✧</span><span className="art-dot dot-one" /><span className="art-dot dot-two" />
          </div>
          <div className="hero-footer"><span>01 / APRENDER</span><span>UM PERCURSO, MUITAS DESCOBERTAS</span><span>PORTUGAL · ONLINE</span></div>
        </section>

        <section className="intro-strip" id="instituto">
          <div className="intro-label">A NOSSA VISÃO</div>
          <p>O conhecimento ganha sentido quando é vivido. Criamos espaço para aprender, praticar e integrar — com rigor, sensibilidade e respeito pelo percurso de cada pessoa.</p>
          <span className="intro-ornament" aria-hidden="true">✳</span>
        </section>

        <section className="school-section" id="escola">
          <div className="section-heading">
            <div><p className="eyebrow">ESCOLA ONLINE</p><h2>Encontra o teu <em>caminho.</em></h2></div>
            <p className="section-intro">Formações para explorar saberes, aprofundar a prática e desenvolver competências com intenção.</p>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <article className="course-card" key={course.number}>
                <div className="course-top"><span>{course.number}</span><span className="course-symbol" aria-hidden="true">{course.number === '01' ? '◉' : course.number === '02' ? 'ᚱ' : '〰'}</span></div>
                <p className="course-category">{course.category}</p>
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-bottom"><span>{course.status}</span><span aria-hidden="true">↗</span></div>
              </article>
            ))}
          </div>
          <p className="section-footnote">A Escola Online está em desenvolvimento. A formação de Reiki será o primeiro percurso a ser implementado.</p>
        </section>

        <section className="path-section" id="experiencias">
          <div className="path-copy"><p className="eyebrow">PARA ALÉM DA ESCOLA</p><h2>O saber também se <em>experiencia.</em></h2><p>Práticas, experiências sonoras, encontros e retiros terão o seu espaço numa plataforma que acompanha diferentes formas de aprender e integrar.</p></div>
          <div className="path-list"><div><span>01</span><strong>Práticas e experiências</strong><span>Em preparação ↗</span></div><div><span>02</span><strong>Eventos e retiros</strong><span>Em preparação ↗</span></div><div><span>03</span><strong>Comunidade de aprendizagem</strong><span>Em preparação ↗</span></div></div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true"><span>〰</span></span><span className="brand-copy"><strong>VibraSer</strong><small>CONHECER · INTEGRAR · TRANSFORMAR</small></span></a>
        <span>Instituto VibraSer © {new Date().getFullYear()}</span>
        <span className={isSupabaseConfigured ? 'connection-status connected' : 'connection-status'}><span />{isSupabaseConfigured ? 'Serviços configurados' : 'Configuração técnica em preparação'}</span>
      </footer>

      {authOpen && (
        <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button>
            <p className="eyebrow">INSTITUTO VIBRASER</p>
            <h2 id="auth-title">{user ? 'A tua conta' : authMode === 'signin' ? 'Bem-vindo de volta.' : 'Começa o teu caminho.'}</h2>
            {user ? (
              <div className="account-summary">
                <p>Sessão iniciada com</p>
                <strong>{user.email || 'Conta autenticada'}</strong>
                <p className="auth-note">A área de aluno será ligada às formações e ao progresso numa fase seguinte.</p>
                <button className="button-primary auth-submit" onClick={handleSignOut}>Terminar sessão</button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit}>
                {!isSupabaseConfigured && <p className="auth-note">A autenticação ainda não está ligada a este ambiente. Primeiro é necessário configurar as variáveis de ambiente e aplicar a migração da base de dados.</p>}
                {authMode === 'signup' && (
                  <label>Nome completo
                    <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} />
                  </label>
                )}
                <label>Email
                  <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label>Palavra-passe
                  <input type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
                  {authMode === 'signup' && <small>Utiliza pelo menos 8 caracteres.</small>}
                </label>
                {authError && <p className="auth-feedback error" role="alert">{authError}</p>}
                {authMessage && <p className="auth-feedback success" role="status">{authMessage}</p>}
                <button className="button-primary auth-submit" type="submit" disabled={authBusy || !isSupabaseConfigured}>
                  {authBusy ? 'A processar…' : authMode === 'signin' ? 'Iniciar sessão' : 'Criar conta'}
                </button>
                <p className="auth-switch">
                  {authMode === 'signin' ? 'Ainda não tens conta?' : 'Já tens conta?'}{' '}
                  <button type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); setAuthMessage(''); }}>
                    {authMode === 'signin' ? 'Criar conta' : 'Iniciar sessão'}
                  </button>
                </p>
              </form>
            )}
            {authError && user && <p className="auth-feedback error" role="alert">{authError}</p>}
            {authMessage && user && <p className="auth-feedback success" role="status">{authMessage}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
