// Configuración
const SERVER_URL = 'http://localhost:3000';
const SYNC_INTERVAL = 3000; // 3 segundos
const CONNECTION_CHECK_INTERVAL = 2000; // 2 segundos

// Estado de la aplicación
class NotesApp {
    constructor() {
        this.notes = [];
        this.isOnline = false;
        this.editingNoteId = null;
        this.syncTimer = null;
        this.connectionTimer = null;
        this.justDeletedIds = new Set(); // IDs que acabamos de eliminar
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
        
        // permitir agregar con Enter en el título
        document.getElementById('note-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNote();
            }
        });
        
        // event delegation para todos los botones de notas
        const notesList = document.getElementById('notes-list');
        notesList.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            e.preventDefault();
            const action = button.dataset.action;
            const noteId = button.dataset.noteId;
            
            console.log('Botón clickeado:', action, 'noteId:', noteId);
            
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
        // Limpiar inputs
        titleInput.value = '';
        contentInput.value = '';
        titleInput.focus();
        // Sincronizar con el servidor si hay conexión
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
            
            // Sincronizar con el servidor si hay conexión
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
        console.log('deleteNote llamado con id:', id);
        const confirmation = confirm('¿Estás seguro de eliminar esta notaa?');
        console.log('Confirmación:', confirmation);
        
        if (confirmation) {
            // Marcar como eliminada PERMANENTEMENTE
            this.justDeletedIds.add(id);
            console.log('Nota marcada como eliminada permanentemente:', id);
            
            // Eliminar localmente primero
            this.notes = this.notes.filter(n => n.id !== id);
            this.saveToLocalStorage();
            this.render();
            console.log('Nota eliminada localmente');
            
            // Eliminar del servidor si hay conexión
            if (this.isOnline) {
                try {
                    const response = await fetch(`${SERVER_URL}/api/notes/${id}`, {
                        method: 'DELETE'
                    });
                    console.log('Nota eliminada del servidor, status:', response.status);
                    
                    // Sincronizar INMEDIATAMENTE después de eliminar
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
        
        // Ordenar notas por última modificación (más recientes primero)
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
        
        // No necesitamos attachEventListeners aquí porque 
        // ya usamos event delegation en setupEventListeners
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // LocalStorage
    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
        // Guardar también los IDs eliminados
        localStorage.setItem('justDeletedIds', JSON.stringify([...this.justDeletedIds]));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('notes');
        if (stored) {
            this.notes = JSON.parse(stored);
        }
        
        // Cargar IDs eliminados
        const deletedIds = localStorage.getItem('justDeletedIds');
        if (deletedIds) {
            this.justDeletedIds = new Set(JSON.parse(deletedIds));
            console.log('IDs eliminados cargados:', this.justDeletedIds.size);
        }
    }

    // Monitoreo de conexión
    async checkConnection() {
        try {
            const response = await fetch(`${SERVER_URL}/api/health`, {
                method: 'GET',
                timeout: 2000
            });
            
            const wasOffline = !this.isOnline;
            this.isOnline = response.ok;
            
            // Si acabamos de conectarnos, sincronizar
            if (wasOffline && this.isOnline) {
                console.log('Conexión restablecida. Sincronizando...');
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
                console.log('Sincronización exitosa');
            }
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.isOnline = false;
            this.updateConnectionStatus();
        }
    }

    // Last Write Wins: fusionar notas del servidor
    mergeNotes(serverNotes, serverDeletedIds = []) {
        // NO fusionar si estamos editando una nota
        if (this.editingNoteId) {
            console.log('Saltando sincronización porque estamos editando:', this.editingNoteId);
            return;
        }
        
        console.log('Fusionando notas. Servidor tiene:', serverNotes.length, 'notas');
        console.log('Servidor tiene eliminados:', serverDeletedIds);
        console.log('IDs eliminados localmente:', [...this.justDeletedIds]);
        
        // Agregar los IDs eliminados del servidor a nuestra lista local
        serverDeletedIds.forEach(id => {
            this.justDeletedIds.add(id);
        });
        
        // Eliminar notas que están en la lista de eliminados del servidor
        this.notes = this.notes.filter(note => {
            if (this.justDeletedIds.has(note.id)) {
                console.log('Eliminando nota porque está en lista de eliminados:', note.id);
                return false;
            }
            return true;
        });
        
        const serverIds = new Set(serverNotes.map(n => n.id));
        this.justDeletedIds.forEach(deletedId => {
            if (!serverIds.has(deletedId)) {
                console.log('Servidor confirma eliminación de:', deletedId);
                this.justDeletedIds.delete(deletedId);
            }
        });
        
        // Eliminar notas locales que YA NO están en el servidor
        // EXCEPTO las que están marcadas como eliminadas
        this.notes = this.notes.filter(localNote => {
            if (this.justDeletedIds.has(localNote.id)) {
                console.log('Manteniendo nota eliminada:', localNote.id);
                return false; // Mantener eliminada
            }
            if (serverIds.has(localNote.id)) {
                return true; // Mantener
            } else {
                console.log('Eliminando nota local que no está en servidor:', localNote.id);
                return false; // Eliminar
            }
        });
        
        // Agregar o actualizar notas del servidor
        // EXCEPTO las que están marcadas como eliminadas
        serverNotes.forEach(serverNote => {
            if (this.justDeletedIds.has(serverNote.id)) {
                console.log('Ignorando nota del servidor que eliminamos:', serverNote.id);
                return; // No agregar notas que eliminamos
            }
            
            const localNote = this.notes.find(n => n.id === serverNote.id);
            
            if (!localNote) {
                // Nota nueva del servidor
                console.log('Agregando nota nueva del servidor:', serverNote.id);
                this.notes.push(serverNote);
            } else if (serverNote.lastModified > localNote.lastModified) {
                // El servidor tiene versión más reciente
                console.log('Actualizando nota con versión del servidor:', serverNote.id);
                Object.assign(localNote, serverNote);
            }
        });
        
        console.log('Después de fusionar, tengo:', this.notes.length, 'notas');
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
