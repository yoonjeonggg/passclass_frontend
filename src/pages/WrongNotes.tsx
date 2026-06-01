import React, { useEffect, useState, useCallback } from 'react';
import { wrongNoteApi } from '../api';
import type { WrongNoteResponse } from '../types';
import { IconFileText, IconCheck, IconX, IconTrash } from '../components/Icons';
import { useToast } from '../components/Toast';
import './WrongNotes.css';

const OPTIONS = ['①', '②', '③', '④'];

export default function WrongNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<WrongNoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wrongNoteApi.getMyNotes();
      setNotes(res.data);
    } catch (err: unknown) {
      setNotes([]);
      toast(err instanceof Error ? err.message : '오답노트를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async (wrongNoteId: number) => {
    if (!window.confirm('이 오답노트를 삭제하시겠습니까?')) return;
    setDeletingId(wrongNoteId);
    try {
      await wrongNoteApi.deleteNote(wrongNoteId);
      setNotes(prev => prev.filter(n => n.wrongNoteId !== wrongNoteId));
      toast('오답노트가 삭제되었습니다', 'success');
    } catch {
      toast('삭제에 실패했습니다', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getOptionClass = (note: WrongNoteResponse, optionNum: number) => {
    if (optionNum === note.correctAnswer) return 'wn-option correct';
    if (optionNum === note.selectedAnswer) return 'wn-option wrong';
    return 'wn-option';
  };

  const optionTexts = (note: WrongNoteResponse) => [
    note.option1, note.option2, note.option3, note.option4,
  ];

  return (
    <div className="wrong-notes-page">
      <div className="wn-hero">
        <div className="container">
          <h1 className="wn-hero-title">오답노트</h1>
          <p className="wn-hero-sub">틀린 문제를 다시 확인하고 취약점을 보완하세요</p>
        </div>
      </div>

      <div className="container wn-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : notes.length === 0 ? (
          <div className="wn-empty">
            <div className="wn-empty-icon"><IconFileText size={40} /></div>
            <p className="wn-empty-title">오답노트가 없습니다</p>
            <p className="wn-empty-sub">문제를 풀고 틀린 문제가 생기면 여기에 자동으로 추가됩니다</p>
          </div>
        ) : (
          <>
            <div className="wn-header-bar">
              <span className="wn-total">총 <strong>{notes.length}</strong>개의 오답</span>
            </div>
            <div className="wn-list">
              {notes.map((note, idx) => (
                <div key={note.wrongNoteId} className="wn-card">
                  <div className="wn-card-header">
                    <div className="wn-card-num-wrap">
                      <span className="wn-card-idx">Q{idx + 1}</span>
                      <div className="wn-answer-badges">
                        <span className="badge badge-wrong">
                          <IconX size={11} /> 내 답: {note.selectedAnswer}번
                        </span>
                        <span className="badge badge-correct">
                          <IconCheck size={11} /> 정답: {note.correctAnswer}번
                        </span>
                      </div>
                    </div>
                    <button
                      className="wn-delete-btn"
                      onClick={() => handleDelete(note.wrongNoteId)}
                      disabled={deletingId === note.wrongNoteId}
                      aria-label="삭제"
                    >
                      {deletingId === note.wrongNoteId
                        ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        : <IconTrash size={16} />
                      }
                    </button>
                  </div>

                  <p className="wn-content">{note.content}</p>

                  <div className="wn-options">
                    {optionTexts(note).map((text, i) => (
                      <div key={i} className={getOptionClass(note, i + 1)}>
                        <span className="wn-option-num">{OPTIONS[i]}</span>
                        <span className="wn-option-text">{text}</span>
                        {i + 1 === note.correctAnswer && (
                          <span className="wn-option-tag correct-tag"><IconCheck size={11} /> 정답</span>
                        )}
                        {i + 1 === note.selectedAnswer && i + 1 !== note.correctAnswer && (
                          <span className="wn-option-tag wrong-tag"><IconX size={11} /> 내 답</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {note.explanation && (
                    <div className="wn-explanation">
                      <span className="wn-explanation-label">해설</span>
                      <p className="wn-explanation-text">{note.explanation}</p>
                    </div>
                  )}

                  {note.memo && (
                    <div className="wn-memo">
                      <span className="wn-memo-label">메모</span>
                      <p className="wn-memo-text">{note.memo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
