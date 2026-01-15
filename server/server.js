const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Almacenamiento en memoria
let notes = {};
let deletedIds = new Set();

app.use(cors());
app.use(express.json());

// POST /api/notes/sync - Sincronizar notas (Last Write Wins)
app.post('/api/notes/sync', (req, res) => {
  const clientNotes = req.body.notes || [];
  
  clientNotes.forEach(clientNote => {
    // No agregar si fue eliminada en el servidor
    if (deletedIds.has(clientNote.id)) {
      return;
    }
    
    const serverNote = notes[clientNote.id];
    
    // Last Write Wins: comparar timestamps
    if (!serverNote || clientNote.lastModified > serverNote.lastModified) {
      notes[clientNote.id] = clientNote;
    }
  });
  
  res.json({
    notes: Object.values(notes),
    deletedIds: Array.from(deletedIds)
  });
});

// DELETE /api/notes/:id - Eliminar una nota
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  
  deletedIds.add(id);
  delete notes[id];
  
  res.status(204).send();
});

// Health check para verificar conexión
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
