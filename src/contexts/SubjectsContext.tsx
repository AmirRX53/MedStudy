import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Subject, Chapter } from '../types';
import { loadStored, saveStored } from '../lib/storage';
import { useDiseases } from './DiseasesContext';

interface SubjectsContextType {
  subjects: Subject[];
  addSubject: (name: string) => Subject;
  updateSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  reorderSubjects: (fromIndex: number, toIndex: number) => void;
  addChapter: (subjectId: string, name: string) => Chapter;
  updateChapter: (subjectId: string, chapterId: string, name: string) => void;
  deleteChapter: (subjectId: string, chapterId: string) => void;
  reorderChapters: (subjectId: string, fromIndex: number, toIndex: number) => void;
}

const SubjectsContext = createContext<SubjectsContextType | null>(null);

function loadSubjects(): Subject[] {
  return loadStored('medstudy-subjects', [], value => Array.isArray(value) && value.every(subject => {
    if (!subject || typeof subject !== 'object') return false;
    const candidate = subject as { id?: unknown; name?: unknown; chapters?: unknown };
    return typeof candidate.id === 'string' && typeof candidate.name === 'string' && Array.isArray(candidate.chapters);
  }));
}

function saveSubjects(subjects: Subject[]) {
  saveStored('medstudy-subjects', subjects);
}

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const { diseases, deleteDiseases } = useDiseases();
  const [subjects, setSubjects] = useState<Subject[]>(loadSubjects);

  useEffect(() => {
    saveSubjects(subjects);
  }, [subjects]);

  const addSubject = useCallback((name: string): Subject => {
    const newSubject: Subject = {
      id: uuidv4(),
      name,
      order: subjects.length,
      chapters: [],
    };
    setSubjects(prev => [...prev, newSubject]);
    return newSubject;
  }, [subjects.length]);

  const updateSubject = useCallback((id: string, name: string) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    const diseaseIds = diseases.filter(disease => disease.subjectId === id).map(disease => disease.id);
    deleteDiseases(diseaseIds);
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, [diseases, deleteDiseases]);

  const reorderSubjects = useCallback((fromIndex: number, toIndex: number) => {
    setSubjects(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const addChapter = useCallback((subjectId: string, name: string): Chapter => {
    const newChapter: Chapter = {
      id: uuidv4(),
      name,
      subjectId,
      order: 0,
    };
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, chapters: [...s.chapters, { ...newChapter, order: s.chapters.length }] };
    }));
    return newChapter;
  }, []);

  const updateChapter = useCallback((subjectId: string, chapterId: string, name: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, chapters: s.chapters.map(c => c.id === chapterId ? { ...c, name } : c) };
    }));
  }, []);

  const deleteChapter = useCallback((subjectId: string, chapterId: string) => {
    const diseaseIds = diseases
      .filter(disease => disease.subjectId === subjectId && disease.chapterId === chapterId)
      .map(disease => disease.id);
    deleteDiseases(diseaseIds);
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, chapters: s.chapters.filter(c => c.id !== chapterId) };
    }));
  }, [diseases, deleteDiseases]);

  const reorderChapters = useCallback((subjectId: string, fromIndex: number, toIndex: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const arr = [...s.chapters];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { ...s, chapters: arr.map((c, i) => ({ ...c, order: i })) };
    }));
  }, []);

  return (
    <SubjectsContext.Provider value={{
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      reorderSubjects,
      addChapter,
      updateChapter,
      deleteChapter,
      reorderChapters,
    }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext);
  if (!ctx) throw new Error('useSubjects must be used within SubjectsProvider');
  return ctx;
}
