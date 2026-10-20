import React, { useState, useEffect, useRef } from 'react';
import { FileText, ExternalLink, Upload, Trash2, Download, Eye, CheckCircle2 } from 'lucide-react';

interface EditalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  currentTitle?: string;
  currentUrl?: string;
  currentNotes?: string;
  currentFileName?: string;
  currentFileBase64?: string;
  onSave: (data: {
    edital_title: string;
    edital_url: string;
    edital_notes: string;
    edital_file_name?: string;
    edital_file_base64?: string;
  }) => Promise<void> | void;
}

export const EditalModal: React.FC<EditalModalProps> = ({
  isOpen,
  onClose,
  projectName,
  currentTitle = '',
  currentUrl = '',
  currentNotes = '',
  currentFileName = '',
  currentFileBase64 = '',
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || (projectName ? `Edital - ${projectName}` : ''));
      setUrl(currentUrl || '');
      setNotes(currentNotes || '');
      setFileName(currentFileName || '');
      setFileBase64(currentFileBase64 || '');
      setIsSaving(false);
      setSaveSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, currentTitle, currentUrl, currentNotes, currentFileName, currentFileBase64, projectName]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('O arquivo selecionado excede o limite recomendado de 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setFileName(file.name);
        setFileBase64(result);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadFile = () => {
    if (!fileBase64) return;
    const link = document.createElement('a');
    link.href = fileBase64;
    link.download = fileName || 'edital-concurso.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewPdf = () => {
    if (!fileBase64) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${fileBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = fileName || 'Visualização do Edital';
    } else {
      handleDownloadFile();
    }
  };

  const handleOpenUrl = () => {
    if (!url) return;
    const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    window.open(validUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await onSave({
        edital_title: title.trim(),
        edital_url: url.trim(),
        edital_notes: notes.trim(),
        edital_file_name: fileName,
        edital_file_base64: fileBase64
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Erro ao salvar o edital.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[560px] p-6">
        <div className="modal-header pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <h3 className="modal-title text-base font-bold text-[var(--text)]">Edital do Concurso</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {projectName ? `Concurso: ${projectName}` : 'Documento e diretrizes do concurso'}
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} disabled={isSaving} aria-label="Fechar">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="auth-alert-message error text-xs my-2">
            {errorMsg}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-2 rounded-lg my-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Edital salvo com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-3">
          {/* Identificação do Edital */}
          <div className="form-field">
            <label htmlFor="editalTitle" className="text-xs font-semibold text-[var(--text)]">
              Identificação do Edital
            </label>
            <input
              type="text"
              id="editalTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Edital nº 01/2026 - TRT 3ª Região"
              className="text-sm"
            />
          </div>

          {/* Link Oficial */}
          <div className="form-field">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="editalUrl" className="text-xs font-semibold text-[var(--text)]">
                Link Oficial da Banca / Diário Oficial
              </label>
              {url.trim() && (
                <button
                  type="button"
                  onClick={handleOpenUrl}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Abrir link</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              type="text"
              id="editalUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com.br/concurso-edital"
              className="text-sm"
            />
          </div>

          {/* Arquivo PDF do Edital */}
          <div className="form-field">
            <label className="text-xs font-semibold text-[var(--text)] mb-1 block">
              Arquivo do Edital (PDF)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {fileName ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate text-xs font-medium text-[var(--text)]" title={fileName}>
                    {fileName}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={handleViewPdf}
                    className="p-1.5 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    title="Visualizar Edital"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="p-1.5 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                    title="Baixar Edital"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    title="Remover arquivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-lg p-4 text-center cursor-pointer bg-[var(--surface-subtle)] hover:bg-[var(--surface)] transition-all flex flex-col items-center justify-center gap-1.5 group"
              >
                <Upload className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
                <span className="text-xs font-medium text-[var(--text)]">
                  Clique para anexar o PDF do edital
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Suporta arquivos PDF até 20MB
                </span>
              </div>
            )}
          </div>

          {/* Anotações e Diretrizes do Edital */}
          <div className="form-field">
            <label htmlFor="editalNotes" className="text-xs font-semibold text-[var(--text)] mb-1 block">
              Regras Importantes & Anotações do Edital
            </label>
            <textarea
              id="editalNotes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Peso 2 para Direito Administrativo e Constitucional. Redação mínimo 15 pontos. Data de inscrições até 25/11. Prova objetiva de 60 questões."
              className="text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text)] leading-relaxed resize-y focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="modal-actions pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              className="btn-modal-cancel text-xs px-3 py-2"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-save text-xs px-4 py-2"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Edital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
