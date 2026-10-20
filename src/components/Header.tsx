import React, { useRef } from 'react';
import { UserProfile } from '../types';
import { Pencil, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  onOpenEditProfile: () => void;
  onAvatarUpload: (base64: string) => void;
  onLogout: () => void;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenEditProfile,
  onAvatarUpload,
  onLogout,
  onSyncNow,
  isSyncing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          onAvatarUpload(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header>
      <div className="header-left">
        <div
          className="avatar-wrapper"
          onClick={() => fileInputRef.current?.click()}
          title="Clique para trocar foto"
        >
          <img
            id="profileImg"
            src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt="Foto do perfil"
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <div className="profile-meta">
          <div
            className="profile-name-row group"
            onClick={onOpenEditProfile}
            title="Clique para editar seu nome, concurso e data da prova"
          >
            <span className="profile-user-name">{user.name || "Concurseiro"}</span>
            <span className="edit-pencil-icon p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="profile-user-email">{user.email || ""}</span>
        </div>
      </div>

      <div
        className="header-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onOpenEditProfile}
        title="Clique para editar o nome do concurso, projeto e data da prova"
      >
        <h1 className="header-center-title">
          <span>{user.project_name || "MEU PROJETO"}</span>
        </h1>
      </div>

      <div className="header-right">
        {onSyncNow && (
          <button
            type="button"
            className="btn-sync-header"
            onClick={onSyncNow}
            title="Sincronizar dados em tempo real com todos os dispositivos"
            disabled={isSyncing}
            aria-label="Sincronizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        )}

        <label className="theme-switch" title="Alternar tema Claro/Escuro">
          <input
            type="checkbox"
            checked={isDark}
            onChange={(e) => onToggleTheme(e.target.checked)}
          />
          <span className="theme-slider">
            <span className="theme-icon flex items-center justify-center">
              <Sun className="w-3 h-3 text-amber-500" />
            </span>
            <span className="theme-icon flex items-center justify-center">
              <Moon className="w-3 h-3 text-indigo-400" />
            </span>
          </span>
        </label>

        <button
          className="btn-logout flex items-center gap-1.5"
          onClick={onLogout}
          title="Encerrar sessão com segurança"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};
