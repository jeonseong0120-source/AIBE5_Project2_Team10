-- Normalize projects column name: Deadline -> deadline
-- Note: MySQL on Windows can be case-insensitive depending on lower_case_table_names;
-- this migration uses CHANGE COLUMN to ensure the column is renamed explicitly.
ALTER TABLE projects
CHANGE COLUMN `Deadline` `deadline` DATE NOT NULL;

