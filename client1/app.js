// Configuración
const SERVER_URL = 'http://localhost:3000';
const SYNC_INTERVAL = 3000; // 3 segundos
const CONNECTION_CHECK_INTERVAL = 2000; // 2 segundos

class NotesApp {
    constructor() {
        this.notes = [];
        this.isOnline = false;
        this.editingNoteId = null;
        this.syncTimer = null;
        this.connectionTimer = null;
        this.justDeletedIds = new Set();
        
        this.init();
    }

    init() {
        // Cargar notas desde LocalStorage
        this.loadFromLocalStorage();
        // Configurar event listeners
        this.setupEventListeners();     
        // Renderizar notas
        this.render();  
        // Iniciar monitoreo de conexión
        this.startConnectionMonitoring();
        // Iniciar sincronización automática
        this.startAutoSync();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('add-note-btn');
        addBtn.addEventListener('click', () => this.addNote());
        
        // argegar nota con Enter en el título
        document.getElementById('note-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNote();
            }
        });
        
        // event delegation para botones de notas
        const notesList = document.getElementById('notes-list');
        notesList.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            e.preventDefault();
            const action = button.dataset.action;
            const noteId = button.dataset.noteId;
            if (action === 'edit') {
                this.editNote(noteId);
            } else if (action === 'delete') {
                this.deleteNote(noteId);
            } else if (action === 'save') {
                this.saveEdit(noteId);
            } else if (action === 'cancel') {
                this.cancelEdit();
            }
        });
    }

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    addNote() {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title || !content) {
            alert('Por favor completa el título y contenido de la nota');
            return;
        }
        const note = {
            id: this.generateId(),
            title: title,
            content: content,
            createdAt: Date.now(),
            lastModified: Date.now()
        };
        this.notes.push(note);
        this.saveToLocalStorage();
        this.render();
        // limpiar inputs
        titleInput.value = '';
        contentInput.value = '';
        titleInput.focus();
        
        // sincronizar con el servidor si hay conexión
        if (this.isOnline) {
            this.syncWithServer();
        }
    }
    editNote(id) {
        this.editingNoteId = id;
        this.render();
    }
    saveEdit(id) {
        const titleInput = document.querySelector(`#title-input-${id}`);
        const contentInput = document.querySelector(`#content-input-${id}`);
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.title = titleInput.value.trim();
            note.content = contentInput.value.trim();
            note.lastModified = Date.now();      
            this.saveToLocalStorage();
            this.editingNoteId = null;
            this.render();
            // sincronizar con el servidor si hay conexión
            if (this.isOnline) {
                this.syncWithServer();
            }
        }
    }

    cancelEdit() {
        this.editingNoteId = null;
        this.render();
    }
    async deleteNote(id) {
        const confirmation = confirm('¿Estás seguro de eliminar esta notaa?');
        if (confirmation) {
            this.justDeletedIds.add(id);
            this.notes = this.notes.filter(n => n.id !== id);
            this.saveToLocalStorage();
            this.render();
            if (this.isOnline) {
                try {
                    await fetch(`${SERVER_URL}/api/notes/${id}`, {
                        method: 'DELETE'
                    });
                    await this.syncWithServer();
                } catch (error) {
                    console.error('Error al eliminar del servidor:', error);
                }
            }
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    render() {
        const notesList = document.getElementById('notes-list');
        if (this.notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No hay notas todavía. ¡Crea tu primera nota!</div>
                </div>
            `;
            return;
        }
        // ordenar notas por última modificación
        const sortedNotes = [...this.notes].sort((a, b) => b.lastModified - a.lastModified);
        notesList.innerHTML = sortedNotes.map(note => {
            const isEditing = this.editingNoteId === note.id;
            if (isEditing) {
                return `
                    <div class="note-card editing">
                        <input type="text" 
                               id="title-input-${note.id}" 
                               class="note-title-input" 
                               value="${this.escapeHtml(note.title)}" />
                        <textarea id="content-input-${note.id}" 
                                  class="note-content-input">${this.escapeHtml(note.content)}</textarea>
                        <div class="note-actions">
                            <button class="btn btn-save" data-action="save" data-note-id="${note.id}">
                                 Guardar
                            </button>
                            <button class="btn btn-cancel" data-action="cancel">
                                 Cancelar
                            </button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="note-card">
                    <div class="note-header">
                        <div>
                            <div class="note-title">${this.escapeHtml(note.title)}</div>
                            <div class="note-timestamp">
                                Modificado: ${this.formatTimestamp(note.lastModified)}
                            </div>
                        </div>
                    </div>
                    <div class="note-content">${this.escapeHtml(note.content)}</div>
                    <div class="note-actions">
                        <button class="btn btn-edit" data-action="edit" data-note-id="${note.id}">
                             Editar
                        </button>
                        <button class="btn btn-delete" data-action="delete" data-note-id="${note.id}">
                             Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // localStorage
    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
        localStorage.setItem('justDeletedIds', JSON.stringify([...this.justDeletedIds]));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('notes');
        if (stored) {
            this.notes = JSON.parse(stored);
        }
        
        const deletedIds = localStorage.getItem('justDeletedIds');
        if (deletedIds) {
            this.justDeletedIds = new Set(JSON.parse(deletedIds));
        }
    }

    // monitoreo de conexión
    async checkConnection() {
        try {
            const response = await fetch(`${SERVER_URL}/api/health`, {
                method: 'GET',
                timeout: 2000
            });
            const wasOffline = !this.isOnline;
            this.isOnline = response.ok;
            
            if (wasOffline && this.isOnline) {
                this.syncWithServer();
            }
        } catch (error) {
            this.isOnline = false;
        }
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        if (this.isOnline) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            statusText.textContent = 'Conectado';
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Sin conexión';
        }
    }

    startConnectionMonitoring() {
        this.checkConnection();
        this.connectionTimer = setInterval(() => this.checkConnection(), CONNECTION_CHECK_INTERVAL);
    }
    // Sincronización con servidor
    async syncWithServer() {
        if (!this.isOnline) {
            return;
        }
        
        try {
            const response = await fetch(`${SERVER_URL}/api/notes/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: this.notes })
            });
            
            if (response.ok) {
                const serverData = await response.json();
                this.mergeNotes(serverData.notes, serverData.deletedIds);
            }
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.isOnline = false;
            this.updateConnectionStatus();
        }
    }

    // Last Write Wins
    mergeNotes(serverNotes, serverDeletedIds = []) {
        if (this.editingNoteId) {
            return;
        }
        // Agregar IDs eliminados del servidor
        serverDeletedIds.forEach(id => {
            this.justDeletedIds.add(id);
        });
        
        // eliminar notas que están en la lista de eliminados
        this.notes = this.notes.filter(note => !this.justDeletedIds.has(note.id));
        
        const serverIds = new Set(serverNotes.map(n => n.id));
        // limpiar IDs eliminados confirmados por el servidor
        this.justDeletedIds.forEach(deletedId => {
            if (!serverIds.has(deletedId)) {
                this.justDeletedIds.delete(deletedId);
            }
        });
        // Eliminar notas locales que no están en el servidor
        this.notes = this.notes.filter(localNote => {
            if (this.justDeletedIds.has(localNote.id)) {
                return false;
            }
            return serverIds.has(localNote.id);
        });
        // Agregar o actualizar notas del servidor
        serverNotes.forEach(serverNote => {
            if (this.justDeletedIds.has(serverNote.id)) {
                return;
            }
            const localNote = this.notes.find(n => n.id === serverNote.id);
            if (!localNote) {
                this.notes.push(serverNote);
            } else if (serverNote.lastModified > localNote.lastModified) {
                Object.assign(localNote, serverNote);
            }
        });
        
        this.saveToLocalStorage();
        this.render();
    }

    startAutoSync() {
        this.syncTimer = setInterval(() => {
            if (this.isOnline) {
                this.syncWithServer();
            }
        }, SYNC_INTERVAL);
    }

    // Cleanup
    destroy() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        if (this.connectionTimer) clearInterval(this.connectionTimer);
    }
}

// Inicializar aplicación
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NotesApp();
});

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    if (app) app.destroy();
});
