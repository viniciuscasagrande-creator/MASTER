import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  Lock,
  Tag,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { DocumentCategoryItem } from './documents.types';
import { useDiskContext } from '../../core/context/DiskContext';
import { useAuth } from '../../core/auth/AuthContext';

interface DocumentUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialResourceType?: string;
  initialResourceId?: string;
  initialCategoryCode?: string;
}

export const DocumentUploaderModal: React.FC<DocumentUploaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialResourceType,
  initialResourceId,
  initialCategoryCode
}) => {
  const { apiFetch, activeProducer, activeEvent, availableProducers, availableEvents } = useDiskContext();
  const { currentUser } = useAuth();

  const [categories, setCategories] = useState<DocumentCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_contrato');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [producerId, setProducerId] = useState<string>(activeProducer?.id || '');
  const [eventId, setEventId] = useState<string>(activeEvent?.id || '');
  const [isConfidential, setIsConfidential] = useState(false);
  const [validUntil, setValidUntil] = useState('');
  const [tags, setTags] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load categories
    apiFetch('/api/v1/documents/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (initialCategoryCode) {
            const found = data.find(c => c.code === initialCategoryCode || c.id === initialCategoryCode);
            if (found) setSelectedCategory(found.id);
            else if (data.length > 0) setSelectedCategory(data[0].id);
          } else if (data.length > 0 && !selectedCategory) {
            setSelectedCategory(data[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback default categories
        setCategories([
          { id: 'cat_contrato', code: 'CONTRATO', name: 'Contrato', isSensitive: true, createdAt: '' },
          { id: 'cat_nf', code: 'NOTA_FISCAL', name: 'Nota Fiscal', isSensitive: false, createdAt: '' },
          { id: 'cat_comprovante', code: 'COMPROVANTE', name: 'Comprovante', isSensitive: false, createdAt: '' },
          { id: 'cat_boleto', code: 'BOLETO', name: 'Boleto', isSensitive: false, createdAt: '' },
          { id: 'cat_autorizacao', code: 'AUTORIZACAO', name: 'Autorização', isSensitive: false, createdAt: '' },
          { id: 'cat_evidencia', code: 'EVIDENCIA', name: 'Evidência', isSensitive: true, createdAt: '' },
          { id: 'cat_outro', code: 'OUTRO', name: 'Outro', isSensitive: false, createdAt: '' }
        ]);
      });

    if (activeProducer) setProducerId(activeProducer.id);
    if (activeEvent) setEventId(activeEvent.id);
  }, [isOpen, activeProducer, activeEvent, apiFetch]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      // Check forbidden extensions
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (['exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'scr'].includes(ext || '')) {
        setErrorMsg(`Arquivos executáveis (.${ext}) são estritamente bloqueados por política de segurança.`);
        return;
      }

      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) {
      setErrorMsg('Por favor, selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: selectedCategory,
        producerId: producerId || undefined,
        eventId: eventId || undefined,
        isConfidential,
        validUntil: validUntil || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        fileContent: fileBase64,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream'
      };

      if (initialResourceType && initialResourceId) {
        payload.links = [{ resourceType: initialResourceType, resourceId: initialResourceId }];
      }

      const res = await apiFetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar upload do documento.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Enviar Documento ou Anexo</h2>
              <p className="text-xs text-neutral-400">
                Upload centralizado com verificação de segurança e integridade SHA-256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950/50 p-6 text-center hover:border-sky-500/50 transition">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isUploading}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-sky-400" />
                <span className="text-sm font-semibold text-white">{file.name}</span>
                <span className="text-xs text-neutral-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Tipo desconhecido'}
                </span>
                <span className="text-xs text-sky-400 underline mt-1">Clique para substituir o arquivo</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-neutral-500" />
                <span className="text-sm font-medium text-white">
                  Clique ou arraste um arquivo para fazer upload
                </span>
                <span className="text-xs text-neutral-400">
                  PDF, Imagens (PNG, JPEG), XML, Planilhas ou Documentos até 50MB
                </span>
              </div>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Título do Documento *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Ex: Contrato de Locação Espaço"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Categoria Documental *
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isSensitive ? '🔒 (Sensível)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Descrição ou Observações
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalhes sobre o conteúdo ou finalidade deste anexo..."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Producer & Event Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Produtor Relacionado
              </label>
              <select
                value={producerId}
                onChange={e => setProducerId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
              >
                <option value="">Geral / Plataforma (Sem produtor específico)</option>
                {availableProducers.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Evento Relacionado
              </label>
              <select
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
              >
                <option value="">Todos / Não vinculado a evento específico</option>
                {availableEvents
                  .filter((e: any) => !producerId || e.producerId === producerId)
                  .map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Tags & Expiration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Tags (separadas por vírgula)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="ex: contrato, 2026, juridico"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Validade / Expiração Legal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Confidentiality Toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <input
              type="checkbox"
              id="confidentialCheck"
              checked={isConfidential}
              onChange={e => setIsConfidential(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="confidentialCheck" className="text-xs text-neutral-300 cursor-pointer">
              <span className="font-semibold text-amber-400">Documento Confidencial</span> — Restringe a visualização apenas a usuários com permissão de Auditoria e Administração Geral.
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isUploading || !file}
              className="bg-sky-600 hover:bg-sky-500 text-white font-medium"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processando Upload...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Concluir Upload
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
