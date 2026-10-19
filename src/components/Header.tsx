import React, { useRef } from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  onOpenEditProfile: () => void;
  onAvatarUpload: (base64: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDark,
  onToggleTheme,
  onOpenEditProfile,
  onAvatarUpload,
  onLogout
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
            className="profile-name-row"
            onClick={onOpenEditProfile}
            title="Clique para editar seu nome ou concurso"
          >
            <span className="profile-user-name">{user.name || "Concurseiro"}</span>
            <span className="edit-pencil-icon">✏️</span>
          </div>
          <span className="profile-user-email">{user.email || ""}</span>
        </div>
      </div>

      <div className="header-center">
        <h1 className="header-center-title">{user.project_name || "MEU PROJETO"}</h1>
      </div>

      <div className="header-right">
        <label className="theme-switch" title="Alternar tema Claro/Escuro">
          <input
            type="checkbox"
            checked={isDark}
            onChange={(e) => onToggleTheme(e.target.checked)}
          />
          <span className="theme-slider">
            <span className="theme-icon">☀️</span>
            <span className="theme-icon">🌙</span>
          </span>
        </label>

        <button
          className="btn-logout"
          onClick={onLogout}
          title="Sair da conta"
        >
          Sair
        </button>
      </div>
    </header>
  );
};
