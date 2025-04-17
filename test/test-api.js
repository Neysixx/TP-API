const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let createdTaskId = null;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

const log = (test, success, message, data = null) => {
    console.log(
        `${success ? `${colors.green}✓` : `${colors.red}✗`} ${colors.blue}${test}${colors.reset}: ${message}`
    );
    if (data) {
        console.log(`${colors.yellow}  Response:`, JSON.stringify(data, null, 2) + colors.reset);
    }
    console.log();
};

const runTests = async () => {
    console.log(`${colors.blue}=== DÉMARRAGE DES TESTS DE L'API TASK MANAGER ===${colors.reset}\n`);

    try {
        await testWelcomeRoute();
        await testCreateTask();
        await testGetAllTasks();

        if (createdTaskId) {
            await testGetTaskById(createdTaskId);
        }

        if (createdTaskId) {
            await testUpdateTask(createdTaskId);
            await testGetTaskById(createdTaskId);
        }

        if (createdTaskId) {
            await testDeleteTask(createdTaskId);
            await testGetTaskById(createdTaskId, false);
        }

        console.log(`${colors.green}=== TESTS TERMINÉS ===${colors.reset}\n`);
    } catch (error) {
        console.error(`${colors.red}Erreur lors de l'exécution des tests:${colors.reset}`, error);
    }
};

const testWelcomeRoute = async () => {
    try {
        const response = await fetch('http://localhost:3000/');
        const text = await response.text();
        const success = response.ok && text.includes('Welcome');
        log('GET /', success, `Status: ${response.status}, Message: ${text}`);
    } catch (error) {
        log('GET /', false, `Erreur: ${error.message}`);
    }
};

const testCreateTask = async () => {
    try {
        const newTask = {
            title: "Test automatique de l'API",
            description: "Tâche créée par le script de test",
            status: "todo"
        };

        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });

        const data = await response.json();
        const success = response.status === 201 && data.id && data.title === newTask.title;

        if (success) {
            createdTaskId = data.id;
        }

        log('POST /api/tasks', success, `Status: ${response.status}`, data);
    } catch (error) {
        log('POST /api/tasks', false, `Erreur: ${error.message}`);
    }
};

const testGetAllTasks = async () => {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        const data = await response.json();
        const success = response.ok && Array.isArray(data);

        log('GET /api/tasks', success, `Status: ${response.status}, Nombre de tâches: ${data.length}`, data);
    } catch (error) {
        log('GET /api/tasks', false, `Erreur: ${error.message}`);
    }
};

const testGetTaskById = async (id, shouldExist = true) => {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`);

        if (shouldExist) {
            const data = await response.json();
            const success = response.ok && data.id === id;
            log(`GET /api/tasks/${id}`, success, `Status: ${response.status}`, data);
        } else {
            const success = response.status === 404;
            let data;
            try { data = await response.json(); } catch (e) { }
            log(`GET /api/tasks/${id} (404 attendu)`, success, `Status: ${response.status}`, data);
        }
    } catch (error) {
        log(`GET /api/tasks/${id}`, false, `Erreur: ${error.message}`);
    }
};

const testUpdateTask = async (id) => {
    try {
        const updatedTask = {
            title: "Tâche mise à jour par le test",
            description: "Description modifiée par le script de test",
            status: "in_progress"
        };

        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTask)
        });

        const data = await response.json();
        const success = response.ok && data.status === updatedTask.status;

        log(`PUT /api/tasks/${id}`, success, `Status: ${response.status}`, data);
    } catch (error) {
        log(`PUT /api/tasks/${id}`, false, `Erreur: ${error.message}`);
    }
};

const testDeleteTask = async (id) => {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });

        const success = response.status === 204;
        const responseData = null;

        log(`DELETE /api/tasks/${id}`, success, `Status: ${response.status}`, responseData);
    } catch (error) {
        log(`DELETE /api/tasks/${id}`, false, `Erreur: ${error.message}`);
    }
};

runTests();