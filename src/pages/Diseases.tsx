import { useState, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubjects } from '../contexts/SubjectsContext';
import { useDiseases, type ImportResult } from '../contexts/DiseasesContext';
import type { Disease } from '../types';

// ─── Disease Modal ────────────────────────────────────────────────────────────

function DiseaseModal({
  mode,
  disease,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit';
  disease?: Disease;
  onClose: () => void;
  onSave: (name: string, subjectId: string, chapterId: string, keywords: string[]) => void;
}) {
  const { t } = useLanguage();
  const { subjects } = useSubjects();
  const [name, setName] = useState(disease?.name || '');
  const [subjectId, setSubjectId] = useState(disease?.subjectId || '');
  const [chapterId, setChapterId] = useState(disease?.chapterId || '');
  const [keywords, setKeywords] = useState<string[]>(disease?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const keywordRef = useRef<HTMLInputElement>(null);

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const chapters = selectedSubject?.chapters || [];

  const handleAddKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput('');
      keywordRef.current?.focus();
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSave = () => {
    if (!name.trim() || !subjectId || !chapterId) return;
    onSave(name.trim(), subjectId, chapterId, keywords);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{mode === 'add' ? t('addDisease') : t('editDisease')}</h3>

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">{t('diseaseName')}</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('diseaseName')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('subject')}</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={e => { setSubjectId(e.target.value); setChapterId(''); }}
            >
              <option value="">{t('selectSubject')}</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('chapter')}</label>
            <select
              className="form-select"
              value={chapterId}
              onChange={e => setChapterId(e.target.value)}
              disabled={!subjectId}
            >
              <option value="">{t('selectChapter')}</option>
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('keywords')}</label>
            <div className="keyword-input-row">
              <input
                ref={keywordRef}
                className="form-input"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                placeholder={t('keywordPlaceholder')}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddKeyword}>{t('addKeyword')}</button>
            </div>
            {keywords.length > 0 && (
              <div className="keyword-chips">
                {keywords.map(kw => (
                  <span key={kw} className="keyword-chip">
                    {kw}
                    <button className="chip-remove" onClick={() => handleRemoveKeyword(kw)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !subjectId || !chapterId}>
            {t('save')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Disease Card ─────────────────────────────────────────────────────────────

function DiseaseCard({
  disease,
  subjects,
  onEdit,
  onDelete,
}: {
  disease: Disease;
  subjects: { id: string; name: string; chapters: { id: string; name: string }[] }[];
  onEdit: (d: Disease) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLanguage();
  const subject = subjects.find(s => s.id === disease.subjectId);
  const chapter = subject?.chapters.find(c => c.id === disease.chapterId);

  return (
    <div className="disease-card">
      <div className="disease-card-header">
        <h4 className="disease-name">{disease.name}</h4>
        <div className="disease-card-actions">
          <button className="icon-btn small" onClick={() => onEdit(disease)} title={t('editDisease')}>✏️</button>
          <button className="icon-btn small danger" onClick={() => onDelete(disease.id)} title={t('deleteDisease')}>🗑️</button>
        </div>
      </div>
      <div className="disease-path">
        <span>{subject?.name || '?'}</span>
        <span className="path-sep">›</span>
        <span>{chapter?.name || '?'}</span>
      </div>
      {disease.keywords.length > 0 && (
        <div className="disease-keywords">
          {disease.keywords.map(kw => (
            <span key={kw} className="keyword-chip">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Diseases Page ───────────────────────────────────────────────────────

export default function DiseasesPage() {
  const { t, dir } = useLanguage();
  const { subjects, addSubject, addChapter } = useSubjects();
  const { diseases, addDisease, updateDisease, deleteDisease, importDiseases, exportDiseases } = useDiseases();

  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingDisease, setEditingDisease] = useState<Disease | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffleVersion, setShuffleVersion] = useState(0);

  const importRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Filtered chapters depend on selected subject
  const filterChapters = useMemo(() => {
    if (!filterSubject) return [];
    const s = subjects.find(s => s.id === filterSubject);
    return s?.chapters || [];
  }, [filterSubject, subjects]);

  // Filter diseases
  const filteredDiseases = useMemo(() => {
    return diseases.filter(d => {
      if (filterSubject && d.subjectId !== filterSubject) return false;
      if (filterChapter && d.chapterId !== filterChapter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const subject = subjects.find(s => s.id === d.subjectId);
        const chapter = subject?.chapters.find(c => c.id === d.chapterId);
        const haystack = [d.name, subject?.name || '', chapter?.name || '', ...d.keywords].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [diseases, filterSubject, filterChapter, searchQuery, subjects]);

  const displayedDiseases = useMemo(() => {
    const shuffled = [...filteredDiseases];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [filteredDiseases, shuffleVersion]);

  const clearFilters = () => {
    setFilterSubject('');
    setFilterChapter('');
    setSearchQuery('');
  };

  const hasFilters = filterSubject || filterChapter || searchQuery;

  const openAdd = () => { setModalMode('add'); setEditingDisease(null); setShowModal(true); };
  const openEdit = (d: Disease) => { setModalMode('edit'); setEditingDisease(d); setShowModal(true); };

  const handleSave = (name: string, subjectId: string, chapterId: string, keywords: string[]) => {
    if (modalMode === 'add') {
      addDisease(name, subjectId, chapterId, keywords);
    } else if (editingDisease) {
      updateDisease(editingDisease.id, name, subjectId, chapterId, keywords);
    }
  };

  const handleDelete = (id: string) => {
    deleteDisease(id);
    setConfirmDeleteId(null);
  };

  // ─── Export ──────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const rows = exportDiseases(subjects);
    // Build flexible header: name, subject, chapter, then dynamic keyword columns
    const maxKw = Math.max(0, ...rows.map(r => r.keywords.length));
    const headers = ['name', 'subject', 'chapter'];
    for (let i = 1; i <= maxKw; i++) headers.push(`keyword${i}`);

    const data = rows.map(r => {
      const row: Record<string, string> = {
        name: r.name,
        subject: r.subject,
        chapter: r.chapter,
      };
      r.keywords.forEach((kw, i) => { row[`keyword${i + 1}`] = kw; });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diseases');
    XLSX.writeFile(wb, 'diseases.xlsx');
  }, [exportDiseases, subjects]);

  // ─── Import ──────────────────────────────────────────────────────────────────

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      const mappedRows = json.map(row => {
        const name = String(row.name || row['Name'] || '').trim();
        const subjectName = String(row.subject || row['Subject'] || '').trim();
        const chapterName = String(row.chapter || row['Chapter'] || '').trim();
        // Collect all keyword* columns dynamically
        const keywords: string[] = [];
        Object.entries(row).forEach(([key, val]) => {
          if (/^keyword/i.test(key) && String(val).trim()) {
            keywords.push(String(val).trim());
          }
        });
        return { name, subjectName, chapterName, keywords };
      });
      const rows = mappedRows.filter(r => r.name && r.subjectName && r.chapterName);

      const result: ImportResult = importDiseases(rows, subjects, {
        createSubject: (name) => addSubject(name),
        createChapter: (subjectId, name) => addChapter(subjectId, name),
      });
      result.skipped = mappedRows.length - rows.length;
      const msg = t('importResult')
        .replace('{{imported}}', String(result.imported))
        .replace('{{updated}}', String(result.updated))
        .replace('{{skipped}}', String(result.skipped));
      setImportMessage(msg);
      setTimeout(() => setImportMessage(null), 5000);
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  }, [importDiseases, subjects, t]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">🦠 {t('diseases')}</h2>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShuffleVersion(v => v + 1)} title={t('shuffleDiseases')}>🔀 {t('shuffleDiseases')}</button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>{t('exportXlsx')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => importRef.current?.click()}>{t('importXlsx')}</button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-primary" onClick={openAdd}>+ {t('addDisease')}</button>
        </div>
      </div>

      {importMessage && (
        <div className="import-message">{importMessage}</div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <select className="filter-select" value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setFilterChapter(''); }}>
          <option value="">{t('allSubjects')}</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-select" value={filterChapter} onChange={e => setFilterChapter(e.target.value)} disabled={!filterSubject}>
          <option value="">{t('allChapters')}</option>
          {filterChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          className="filter-search"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>{t('clearFilters')}</button>
        )}
      </div>

      {/* Disease Grid */}
      {filteredDiseases.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">{diseases.length === 0 ? t('noDiseases') : t('noResults')}</p>
        </div>
      ) : (
        <div className="disease-grid">
          {displayedDiseases.map(d => (
            <DiseaseCard
              key={d.id}
              disease={d}
              subjects={subjects}
              onEdit={openEdit}
              onDelete={id => setConfirmDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <DiseaseModal
          mode={modalMode}
          disease={editingDisease || undefined}
          onClose={() => { setShowModal(false); setEditingDisease(null); }}
          onSave={handleSave}
        />
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} dir={dir}>
            <p className="modal-text">{t('confirmDeleteDisease')}</p>
            <div className="form-actions">
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDeleteId)}>{t('delete')}</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
