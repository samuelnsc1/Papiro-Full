import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Forgot password state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    const res = await onLogin(cleanEmail, cleanPassword);
    setLoading(false);
    if (res?.error) {
      setAlertInfo({ message: res.error, type: 'error' });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setLoading(true);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();

    const res = await onRegister(cleanName, cleanEmail, cleanPassword);
    setLoading(false);
    if (res?.error) {
      setAlertInfo({ message: res.error, type: 'error' });
    } else {
      setAlertInfo({ message: "Conta criada com sucesso! Carregando seu edital zerado...", type: 'success' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setForgotStatus(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean);
      setLoading(false);
      if (error) {
        setForgotStatus(`Erro: ${error.message}`);
      } else {
        setForgotStatus("Instruções de redefinição enviadas para o seu e-mail!");
      }
    } catch (err: any) {
      setLoading(false);
      setForgotStatus(`Erro: ${err.message || 'Falha ao enviar e-mail'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(circle_at_50%_20%,rgba(29,78,216,0.15)_0%,transparent_60%)]">
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <div className="flex justify-between items-center">
                <label htmlFor="loginPassword">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="text-xs text-[var(--primary)] hover:underline font-bold"
                >
                  {showLoginPassword ? "Ocultar 🙈" : "Mostrar 👁️"}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  id="loginPassword"
                  placeholder="••••••••"
                  className="w-full pr-10"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] mt-0.5">
                <span>Dica móvel: use "Mostrar 👁️" para conferir letras.</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-[var(--primary)] font-bold hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit mt-1"
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
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="name"
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
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <div className="flex justify-between items-center">
                <label htmlFor="regPassword">Senha</label>
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  className="text-xs text-[var(--primary)] hover:underline font-bold"
                >
                  {showRegPassword ? "Ocultar 🙈" : "Mostrar 👁️"}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showRegPassword ? "text" : "password"}
                  id="regPassword"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pr-10"
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit mt-1"
              disabled={loading}
            >
              {loading ? "Criando conta zerada..." : "Criar Conta Zerada"}
            </button>
          </form>
        )}

        {isForgotPasswordOpen && (
          <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl mt-2 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--text)]">Recuperação de Senha</span>
              <button
                type="button"
                className="text-xs text-[var(--text-muted)] font-bold"
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Digite seu e-mail para receber o link de redefinição de senha:
            </p>
            <input
              type="email"
              className="inline-input text-xs"
              placeholder="seuemail@exemplo.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {forgotStatus && (
              <span className="text-[11px] font-bold text-[var(--primary)]">
                {forgotStatus}
              </span>
            )}
            <button
              type="button"
              className="btn-auth-submit py-1 text-xs"
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar E-mail de Recuperação"}
            </button>
          </div>
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
