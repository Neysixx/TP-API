const express = require('express');
const router = express.Router();
const db = require('../db');

// Valeurs autorisées pour le statut des tâches
const VALID_STATUS = ['todo', 'in_progress', 'done'];

/**
 * Récupère toutes les tâches
 * Supporte le filtrage par status via le paramètre de requête 'status'
 */
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT * FROM tasks';
        const params = [];

        if (req.query.status) {
            if (!VALID_STATUS.includes(req.query.status)) {
                return res.status(400).json({ error: `Statut invalide. Les valeurs acceptées sont: ${VALID_STATUS.join(', ')}` });
            }
            query += ' WHERE status = ?';
            params.push(req.query.status);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des tâches' });
    }
});

/**
 * Récupère une tâche spécifique par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération de la tâche' });
    }
});

/**
 * Crée une nouvelle tâche
 * Nécessite au minimum un titre
 * Le status par défaut est 'todo' si non spécifié
 * Le status doit être l'une des valeurs autorisées
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, status = 'todo' } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Le titre est obligatoire' });
        }
        
        if (status && !VALID_STATUS.includes(status)) {
            return res.status(400).json({ 
                error: `Statut invalide. Les valeurs acceptées sont: ${VALID_STATUS.join(', ')}` 
            });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
            [title, description, status]
        );

        const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche' });
    }
});

/**
 * Met à jour une tâche existante identifiée par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status } = req.body;
        const taskId = req.params.id;

        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (task.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        
        if (status && !VALID_STATUS.includes(status)) {
            return res.status(400).json({ 
                error: `Statut invalide. Les valeurs acceptées sont: ${VALID_STATUS.join(', ')}` 
            });
        }

        await db.query(
            'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
            [title, description, status, taskId]
        );

        const [updatedTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.json(updatedTask[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la tâche' });
    }
});

/**
 * Supprime une tâche identifiée par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.delete('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;

        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (task.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);
        res.status(200).json({ message: 'Tâche supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression de la tâche' });
    }
});

module.exports = router;