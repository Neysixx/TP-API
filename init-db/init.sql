CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo','in_progress','done') DEFAULT 'todo'
);

INSERT INTO tasks (title, description, status) VALUES 
('Réviser pour le partiel', 'Chapitres 3 à 5 du cours de base de données', 'todo'),
('Rendre le devoir Node.js', 'Implémenter l\'API CRUD du TP "Task Manager"', 'in_progress');