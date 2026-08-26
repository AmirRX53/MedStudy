import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Disease, Subject } from '../types';
import { loadStored, saveStored, removeDiseaseReviewData } from '../lib/storage';

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

interface DiseasesContextType {
  diseases: Disease[];
  addDisease: (name: string, subjectId: string, chapterId: string, keywords: string[]) => Disease;
  updateDisease: (id: string, name: string, subjectId: string, chapterId: string, keywords: string[]) => void;
  deleteDisease: (id: string) => void;
  deleteDiseases: (ids: string[]) => void;
  importDiseases: (
    rows: { name: string; subjectName: string; chapterName: string; keywords: string[] }[],
    subjects: Subject[],
    callbacks: {
      createSubject: (name: string) => Subject;
      createChapter: (subjectId: string, name: string) => { id: string };
    }
  ) => ImportResult;
  exportDiseases: (subjects: Subject[]) => { name: string; subject: string; chapter: string; keywords: string[] }[];
}

const DiseasesContext = createContext<DiseasesContextType | null>(null);

function loadDiseases(): Disease[] {
  return loadStored('medstudy-diseases', [], value => Array.isArray(value) && value.every(disease => {
    if (!disease || typeof disease !== 'object') return false;
    const candidate = disease as { id?: unknown; name?: unknown; subjectId?: unknown; chapterId?: unknown; keywords?: unknown };
    return typeof candidate.id === 'string' && typeof candidate.name === 'string'
      && typeof candidate.subjectId === 'string' && typeof candidate.chapterId === 'string'
      && Array.isArray(candidate.keywords) && candidate.keywords.every(keyword => typeof keyword === 'string');
  }));
}

function saveDiseases(diseases: Disease[]) {
  saveStored('medstudy-diseases', diseases);
}

export function DiseasesProvider({ children }: { children: ReactNode }) {
  const [diseases, setDiseases] = useState<Disease[]>(loadDiseases);

  useEffect(() => {
    saveDiseases(diseases);
  }, [diseases]);

  const addDisease = useCallback((name: string, subjectId: string, chapterId: string, keywords: string[]): Disease => {
    const newDisease: Disease = { id: uuidv4(), name, subjectId, chapterId, keywords };
    setDiseases(prev => [...prev, newDisease]);
    return newDisease;
  }, []);

  const updateDisease = useCallback((id: string, name: string, subjectId: string, chapterId: string, keywords: string[]) => {
    setDiseases(prev => prev.map(d => d.id === id ? { ...d, name, subjectId, chapterId, keywords } : d));
  }, []);

  const deleteDisease = useCallback((id: string) => {
    setDiseases(prev => prev.filter(d => d.id !== id));
    removeDiseaseReviewData([id]);
  }, []);

  const deleteDiseases = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setDiseases(prev => prev.filter(d => !idSet.has(d.id)));
    removeDiseaseReviewData(ids);
  }, []);

  // Import: merge by same subject+chapter+name
  const importDiseases = useCallback((
    rows: { name: string; subjectName: string; chapterName: string; keywords: string[] }[],
    subjects: Subject[],
    callbacks: {
      createSubject: (name: string) => Subject;
      createChapter: (subjectId: string, name: string) => { id: string };
    }
  ): ImportResult => {
    // Build lookup maps, creating missing subjects/chapters on the fly
    const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s]));
    const chapterMap = new Map<string, string>();
    subjects.forEach(s => {
      s.chapters.forEach(c => {
        chapterMap.set(`${s.id}:${c.name.toLowerCase()}`, c.id);
      });
    });

    // Resolve names to IDs, creating missing subjects/chapters
    const resolved = rows.map(row => {
      // Find or create subject
      let subject = subjectMap.get(row.subjectName.toLowerCase());
      if (!subject) {
        subject = callbacks.createSubject(row.subjectName.trim());
        subjectMap.set(row.subjectName.toLowerCase(), subject);
      }
      // Find or create chapter
      const chapterKey = `${subject.id}:${row.chapterName.toLowerCase()}`;
      let chapterId = chapterMap.get(chapterKey);
      if (!chapterId) {
        const ch = callbacks.createChapter(subject.id, row.chapterName.trim());
        chapterId = ch.id;
        chapterMap.set(chapterKey, chapterId);
      }
      return { name: row.name.trim(), subjectId: subject.id, chapterId, keywords: row.keywords };
    });

    const result: ImportResult = { imported: 0, updated: 0, skipped: 0 };
    const updatedDiseases = [...diseases];

    for (const row of resolved) {
      const existingIndex = updatedDiseases.findIndex(
        d => d.subjectId === row.subjectId && d.chapterId === row.chapterId && d.name.toLowerCase() === row.name.toLowerCase()
      );
      if (existingIndex !== -1) {
        const existing = updatedDiseases[existingIndex];
        const mergedKw = [...new Set([...existing.keywords, ...row.keywords])];
        updatedDiseases[existingIndex] = { ...existing, keywords: mergedKw };
        result.updated++;
      } else {
        updatedDiseases.push({
          id: uuidv4(),
          name: row.name,
          subjectId: row.subjectId,
          chapterId: row.chapterId,
          keywords: row.keywords,
        });
        result.imported++;
      }
    }

    setDiseases(updatedDiseases);

    return result;
  }, [diseases]);

  const exportDiseases = useCallback((subjects: Subject[]) => {
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    return diseases.map(d => {
      const subject = subjectMap.get(d.subjectId);
      const chapter = subject?.chapters.find(c => c.id === d.chapterId);
      return {
        name: d.name,
        subject: subject?.name || '',
        chapter: chapter?.name || '',
        keywords: d.keywords,
      };
    });
  }, [diseases]);

  return (
    <DiseasesContext.Provider value={{ diseases, addDisease, updateDisease, deleteDisease, deleteDiseases, importDiseases, exportDiseases }}>
      {children}
    </DiseasesContext.Provider>
  );
}

export function useDiseases() {
  const ctx = useContext(DiseasesContext);
  if (!ctx) throw new Error('useDiseases must be used within DiseasesProvider');
  return ctx;
}
