import React, { useState, useEffect } from 'react';
import './App.css';

// ---- Theme Colors (passed as CSS vars) ----
const COLORS = {
  primary: '#1976D2',
  secondary: '#424242',
  accent: '#FFC107',
};

// ---- Sidebar Navigation Component ----
// PUBLIC_INTERFACE
function Sidebar({ notes, selectedId, onSelect, onNew }) {
  /** Sidebar lists all notes' titles for navigation. */
  return (
    <nav className="sidebar">
      <div className="sidebar-header">Notes</div>
      <button className="add-note-btn" onClick={onNew}>+ New Note</button>
      <ul className="sidebar-notes-list">
        {notes.length === 0 && (
          <li className="sidebar-empty">No notes yet.</li>
        )}
        {notes.map(note => (
          <li
            key={note.id}
            className={
              'sidebar-note-item' +
              (note.id === selectedId ? ' selected' : '')
            }
            onClick={() => onSelect(note.id)}
            tabIndex={0}
            aria-label={`View note: ${note.title || 'Untitled Note'}`}
          >
            <span className="note-dot" />
            {note.title || <span className="untitled">(Untitled)</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---- Header Component ----
// PUBLIC_INTERFACE
function AppHeader() {
  /** Minimalistic header with app name. */
  return (
    <header className="app-header">
      <span className="app-logo" aria-label="Note icon">📝</span>
      <span className="app-title">Notes</span>
    </header>
  );
}

// ---- Notes List Component ----
// PUBLIC_INTERFACE
function NotesList({ notes, onEdit, onDelete }) {
  /**
   * Displays a list of notes, allows editing or deleting.
   */
  return (
    <section className="notes-list">
      {notes.length === 0 ? (
        <div className="notes-empty">
          <span>Start by creating your first note!</span>
        </div>
      ) : (
        notes.map(note => (
          <NoteItem
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}

// ---- Note Item Component ----
// PUBLIC_INTERFACE
function NoteItem({ note, onEdit, onDelete }) {
  /** Single note item with edit/delete actions. */
  const maxPreviewLen = 120;
  const preview = note.content.length > maxPreviewLen
    ? note.content.slice(0, maxPreviewLen) + '...'
    : note.content;

  return (
    <div className="note-item">
      <div>
        <div className="note-title">{note.title || <span className="untitled">(Untitled)</span>}</div>
        <div className="note-content">{preview}</div>
      </div>
      <div className="note-actions">
        <button className="edit-btn" onClick={() => onEdit(note)}>Edit</button>
        <button className="delete-btn" onClick={() => onDelete(note.id)} aria-label="Delete note">Delete</button>
      </div>
    </div>
  );
}

// ---- Modal Component (for create/edit) ----
// PUBLIC_INTERFACE
function NoteModal({ open, note, onClose, onSave }) {
  /** Modal for editing or creating a note. */
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');

  useEffect(() => {
    if (open) {
      setTitle(note ? note.title : '');
      setContent(note ? note.content : '');
    }
  }, [open, note]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title && !content) return; // Minimal: don't allow empty notes
    onSave({
      ...note,
      title: title.trim(),
      content: content.trim(),
    });
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} tabIndex={0}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <form onSubmit={handleSubmit}>
          <div className="modal-title">
            {note ? 'Edit Note' : 'New Note'}
          </div>
          <input
            className="modal-input"
            type="text"
            placeholder="Title"
            maxLength={100}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="modal-textarea"
            rows={6}
            placeholder="Write your note here..."
            maxLength={4000}
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <div className="modal-actions">
            <button type="submit" className="save-btn" disabled={!content.trim()}>
              {note ? 'Update' : 'Create'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Storage Helpers ----
const STORAGE_KEY = 'mynotes-v1';

// PUBLIC_INTERFACE
function getStoredNotes() {
  /** Load notes from localStorage or use empty array. */
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
// PUBLIC_INTERFACE
function setStoredNotes(notes) {
  /** Persist notes to localStorage. */
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ---- Main App Component (with state) ----
// PUBLIC_INTERFACE
function App() {
  /**
   * Root component: Handles state for notes, selected note, modal, etc.
   */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingNote, setModalEditingNote] = useState(null);

  // ---- On first load: get notes from storage ----
  useEffect(() => {
    setNotes(getStoredNotes());
  }, []);

  // ---- Persist notes on change ----
  useEffect(() => {
    setStoredNotes(notes);
  }, [notes]);

  // ---- Add (open modal for new note) ----
  const handleNewNote = () => {
    setModalEditingNote(null);
    setModalOpen(true);
  };

  // ---- Edit (open modal with note) ----
  const handleEditNote = (note) => {
    setModalEditingNote(note);
    setModalOpen(true);
  };

  // ---- Save/Create Note ----
  const handleSaveNote = (noteData) => {
    if (modalEditingNote) {
      // update
      setNotes(notes =>
        notes.map(n => (n.id === noteData.id ? { ...n, ...noteData } : n))
      );
    } else {
      // create (ids: timestamp + random)
      const newId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setNotes(notes => [
        { id: newId, title: noteData.title, content: noteData.content, created: Date.now() },
        ...notes,
      ]);
      setSelectedId(newId);
    }
    setModalOpen(false);
  };

  // ---- Delete Note ----
  const handleDeleteNote = (id) => {
    setNotes(notes => notes.filter(n => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // ---- Select Note (Sidebar) ----
  const handleSelectNote = (id) => {
    setSelectedId(id);
  };

  // ---- Set up color variables ----
  useEffect(() => {
    for (const [key, val] of Object.entries(COLORS)) {
      document.documentElement.style.setProperty(`--${key}-color`, val);
    }
  }, []);

  // ---- Main Layout ----
  const selectedNote =
    notes.find(n => n.id === selectedId) || (notes.length > 0 ? notes[0] : null);

  return (
    <div className="notes-app">
      <AppHeader />
      <div className="layout">
        <Sidebar
          notes={notes}
          selectedId={selectedNote ? selectedNote.id : null}
          onSelect={handleSelectNote}
          onNew={handleNewNote}
        />
        <main className="main-content">
          <div className="main-toolbar">
            {selectedNote && (
              <button className="edit-btn" onClick={() => handleEditNote(selectedNote)}>
                Edit
              </button>
            )}
            <button className="add-note-btn responsive-only" onClick={handleNewNote}>
              + New Note
            </button>
          </div>
          <section className="note-details">
            {selectedNote ? (
              <>
                <div className="note-details-title">{selectedNote.title || <span className="untitled">(Untitled)</span>}</div>
                <div className="note-details-content pre-wrap">{selectedNote.content}</div>
                <div className="note-details-meta">
                  <span>Created: {new Date(selectedNote.created).toLocaleString()}</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    aria-label="Delete note"
                  >Delete</button>
                </div>
              </>
            ) : (
              <div className="notes-empty-panel">Select a note or create a new one.</div>
            )}
          </section>
          <NotesList notes={notes} onEdit={handleEditNote} onDelete={handleDeleteNote} />
        </main>
      </div>
      <NoteModal
        open={modalOpen}
        note={modalEditingNote}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveNote}
      />
    </div>
  );
}

export default App;
