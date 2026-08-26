import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubjects } from '../contexts/SubjectsContext';
import { useDiseases } from '../contexts/DiseasesContext';
import type { Subject, Chapter } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Sortable Chapter Item ────────────────────────────────────────────────────

function SortableChapter({
  chapter,
  isEditing,
  editName,
  onStartEdit,
  onNameChange,
  onUpdate,
  onCancelEdit,
  onDelete,
  onNavigate,
  cardCount,
}: {
  chapter: Chapter;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onNameChange: (v: string) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
  cardCount: number;
}) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div className="chapter-item" ref={setNodeRef} style={style}>
      <div className="chapter-drag-handle" {...attributes} {...listeners}>⠿</div>
      {isEditing ? (
        <div className="inline-edit">
          <input
            className="inline-input"
            value={editName}
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onUpdate(); if (e.key === 'Escape') onCancelEdit(); }}
            autoFocus
          />
          <button className="icon-btn small" onClick={onUpdate}>✓</button>
          <button className="icon-btn small" onClick={onCancelEdit}>✕</button>
        </div>
      ) : (
        <>
          <span className="chapter-name chapter-link" onClick={onNavigate}>{chapter.name}</span>
          <span className="card-count-badge" title={`${cardCount} 🃏`}>{cardCount} 🃏</span>
          <div className="chapter-actions">
            <button className="icon-btn small" onClick={onStartEdit} title={t('editChapter')}>✏️</button>
            <button className="icon-btn small danger" onClick={onDelete} title={t('delete')}>🗑️</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sortable Subject Item ─────────────────────────────────────────────────────

function SortableSubject({
  subject,
  onEdit,
  onDelete,
  onNavigateToChapter,
}: {
  subject: Subject;
  onEdit: (s: Subject) => void;
  onDelete: (id: string) => void;
  onNavigateToChapter: (subjectId: string, chapterId: string) => void;
}) {
  const { t } = useLanguage();
  const { addChapter, updateChapter, deleteChapter, reorderChapters } = useSubjects();
  const { diseases } = useDiseases();
  const totalCards = diseases.filter(d => d.subjectId === subject.id).length;
  const [expanded, setExpanded] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const chapterSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddChapter = () => {
    if (!chapterName.trim()) return;
    addChapter(subject.id, chapterName.trim());
    setChapterName('');
    setShowAddChapter(false);
  };

  const handleUpdateChapter = (chapterId: string) => {
    if (!chapterName.trim()) return;
    updateChapter(subject.id, chapterId, chapterName.trim());
    setEditingChapterId(null);
    setChapterName('');
  };

  const handleChapterDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = subject.chapters.findIndex(c => c.id === active.id);
      const newIndex = subject.chapters.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderChapters(subject.id, oldIndex, newIndex);
      }
    },
    [subject.id, subject.chapters, reorderChapters]
  );

  return (
    <div className="subject-card" style={style}>
      <div className="subject-header" ref={setNodeRef}>
        <div className="subject-drag-handle" {...attributes} {...listeners}>⠿</div>
        <span className="subject-name subject-toggle" onClick={() => setExpanded(!expanded)} title={expanded ? t('collapseChapters') : t('expandChapters')}>
          <span className="toggle-arrow">{expanded ? '▾' : '▸'}</span>
          {subject.name}
        </span>
        <span className="chapter-count">
          {subject.chapters.length} {t('chapters').toLowerCase()}
        </span>
        <span className="card-count-badge" title={`${totalCards} 🃏`}>{totalCards} 🃏</span>
        <div className="subject-actions">
          <button className="icon-btn" onClick={() => onEdit(subject)} title={t('editSubject')}>✏️</button>
          <button className="icon-btn danger" onClick={() => onDelete(subject.id)} title={t('deleteSubject')}>🗑️</button>
        </div>
      </div>

      {expanded && (
        <div className="chapters-section">
          <DndContext sensors={chapterSensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
            <SortableContext items={subject.chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {subject.chapters.length === 0 && !showAddChapter && (
                <p className="empty-hint">{t('noChapters')}</p>
              )}
              {subject.chapters.map(chapter => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  isEditing={editingChapterId === chapter.id}
                  editName={chapterName}
                  onStartEdit={() => { setEditingChapterId(chapter.id); setChapterName(chapter.name); }}
                  onNameChange={setChapterName}
                  onUpdate={() => handleUpdateChapter(chapter.id)}
                  onCancelEdit={() => { setEditingChapterId(null); setChapterName(''); }}
                  onDelete={() => deleteChapter(subject.id, chapter.id)}
                  onNavigate={() => onNavigateToChapter(subject.id, chapter.id)}
                  cardCount={diseases.filter(d => d.chapterId === chapter.id).length}
                />
              ))}
            </SortableContext>
          </DndContext>

          {showAddChapter ? (
            <div className="add-chapter-form">
              <input
                className="inline-input"
                value={chapterName}
                onChange={e => setChapterName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setShowAddChapter(false); }}
                placeholder={t('chapterName')}
                autoFocus
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddChapter}>{t('save')}</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setShowAddChapter(false); setChapterName(''); }}>{t('cancel')}</button>
            </div>
          ) : (
            <button className="btn btn-sm btn-ghost add-chapter-btn" onClick={() => setShowAddChapter(true)}>
              + {t('addChapter')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Subjects Page ────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { subjects, addSubject, updateSubject, deleteSubject, reorderSubjects } = useSubjects();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    if (!subjectName.trim()) return;
    addSubject(subjectName.trim());
    setSubjectName('');
    setShowAddForm(false);
  };

  const handleEdit = () => {
    if (!editingSubject || !subjectName.trim()) return;
    updateSubject(editingSubject.id, subjectName.trim());
    setEditingSubject(null);
    setSubjectName('');
  };

  const handleDelete = (id: string) => {
    deleteSubject(id);
    setConfirmDeleteId(null);
  };

  const handleNavigateToChapter = (subjectId: string, chapterId: string) => {
    navigate(`/flashcards?subject=${subjectId}&chapter=${chapterId}`);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = subjects.findIndex(s => s.id === active.id);
      const newIndex = subjects.findIndex(s => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSubjects(oldIndex, newIndex);
      }
    },
    [subjects, reorderSubjects]
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">📚 {t('subjectsTitle')}</h2>
        {!showAddForm && !editingSubject && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + {t('addSubject')}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card add-form">
          <input
            className="form-input"
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder={t('subjectName')}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleAdd}>{t('save')}</button>
            <button className="btn btn-ghost" onClick={() => { setShowAddForm(false); setSubjectName(''); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {editingSubject && (
        <div className="card add-form">
          <input
            className="form-input"
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEdit(); }}
            placeholder={t('subjectName')}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleEdit}>{t('save')}</button>
            <button className="btn btn-ghost" onClick={() => { setEditingSubject(null); setSubjectName(''); }}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} dir={dir}>
            <p className="modal-text">{t('confirmDelete')}</p>
            <div className="form-actions">
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDeleteId)}>{t('delete')}</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {subjects.length === 0 && !showAddForm ? (
        <div className="empty-state">
          <p className="empty-text">{t('noSubjects')}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="subjects-list">
              {subjects.map(subject => (
                <SortableSubject
                  key={subject.id}
                  subject={subject}
                  onEdit={s => { setEditingSubject(s); setSubjectName(s.name); }}
                  onDelete={id => setConfirmDeleteId(id)}
                  onNavigateToChapter={handleNavigateToChapter}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
