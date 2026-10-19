import React, { useState } from 'react';

interface AuthViewProps {
  onLogin: (email: string, pass: string) => Promise<{ error?: string }>;
  onRegister: (name: string, email: string, pass: string) => Promise<{ error?: string }>;
  onGuestAccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  onGuestAccess
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setLoading(true);

    const res = await onLogin(loginEmail, loginPassword);
    setLoading(false);
    if (res?.error) {
      setAlertInfo({ message: res.error, type: 'error' });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setLoading(true);

    const res = await onRegister(regName, regEmail, regPassword);
    setLoading(false);
    if (res?.error) {
      setAlertInfo({ message: res.error, type: 'error' });
    } else {
      setAlertInfo({ message: "Conta criada com sucesso! Carregando...", type: 'success' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_20%,rgba(29,78,216,0.15)_0%,transparent_60%)]">
      <div className="auth-card">
        <div className="auth-brand">
          <h2 className="auth-title">PAPIRO FULL</h2>
          <p className="auth-subtitle">Acesse sua conta para organizar seus ciclos e revisões</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setAlertInfo(null);
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setAlertInfo(null);
            }}
          >
            Criar Conta
          </button>
        </div>

        {alertInfo && (
          <div className={`auth-alert-message ${alertInfo.type}`}>
            {alertInfo.message}
          </div>
        )}

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-field">
              <label htmlFor="loginEmail">E-mail</label>
              <input
                type="email"
                id="loginEmail"
                placeholder="seuemail@exemplo.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="loginPassword">Senha</label>
              <input
                type="password"
                id="loginPassword"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-field">
              <label htmlFor="regName">Nome Completo</label>
              <input
                type="text"
                id="regName"
                placeholder="Ex: Samuel"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="regEmail">E-mail</label>
              <input
                type="email"
                id="regEmail"
                placeholder="seuemail@exemplo.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="regPassword">Senha</label>
              <input
                type="password"
                id="regPassword"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[var(--border)] text-center">
          <button
            type="button"
            onClick={onGuestAccess}
            className="text-xs font-bold text-[var(--primary)] hover:underline opacity-80"
          >
            Modo Convidado / Demonstração (Acesso Imediato)
          </button>
        </div>
      </div>
    </div>
  );
};
