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
        // Filtrer par status si spécifié dans la requête
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
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Récupère une tâche spécifique par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération de la tâche:', err);
        res.status(500).json({ error: err.message });
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

        // Validation de base
        if (!title) {
            return res.status(400).json({ error: 'Le titre est obligatoire' });
        }

        if (status && !VALID_STATUS.includes(status)) {
            return res.status(400).json({
                error: `Statut invalide. Les valeurs acceptées sont: ${VALID_STATUS.join(', ')}`
            });
        }

        // Insertion dans la base de données
        const [result] = await db.query(
            'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
            [title, description, status]
        );

        // Renvoyer la tâche créée avec un code 201
        res.status(201).json({
            id: result.insertId,
            title,
            description,
            status
        });
    } catch (err) {
        console.error('Erreur lors de la création de la tâche:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Met à jour une tâche existante identifiée par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status } = req.body;

        // Validation de base
        if (!title && !description && !status) {
            return res.status(400).json({ error: 'Au moins un champ à modifier est requis' });
        }

        // Vérifier que la tâche existe
        const [existingTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);

        if (existingTask.length === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        // Vérification du statut si fourni
        if (status && !VALID_STATUS.includes(status)) {
            return res.status(400).json({
                error: `Statut invalide. Les valeurs acceptées sont: ${VALID_STATUS.join(', ')}`
            });
        }

        // Mettre à jour la tâche
        const task = existingTask[0];
        const updatedTask = {
            title: title || task.title,
            description: description !== undefined ? description : task.description,
            status: status || task.status
        };

        const [result] = await db.query(
            'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
            [updatedTask.title, updatedTask.description, updatedTask.status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Échec de la mise à jour' });
        }

        // Renvoyer la tâche mise à jour
        res.status(200).json({
            id: Number.parseInt(id),
            ...updatedTask
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de la tâche:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Supprime une tâche identifiée par son ID
 * Retourne une erreur 404 si la tâche n'existe pas
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        // Pas de contenu retourné pour une suppression réussie
        res.sendStatus(204);
    } catch (err) {
        console.error('Erreur lors de la suppression de la tâche:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;