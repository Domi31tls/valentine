-- Migration 004: Corriger la structure de about_page
-- Ajouter les colonnes manquantes content et images

-- Ajouter la colonne content si elle n'existe pas
-- SQLite ne supporte pas IF NOT EXISTS pour ALTER TABLE, donc on utilise une approche alternative
PRAGMA table_info(about_page);

-- Cette partie sera gérée par le code TypeScript car SQLite ne permet pas
-- de faire du conditionnel dans les scripts SQL purs
-- Les ALTER TABLE seront exécutés seulement si les colonnes n'existent pas
