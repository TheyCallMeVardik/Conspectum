-- Creates a dedicated database for each service.
-- The POSTGRES_USER already has superuser rights and can create databases.
SELECT 'CREATE DATABASE auth_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

SELECT 'CREATE DATABASE content_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'content_db')\gexec

SELECT 'CREATE DATABASE cards_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cards_db')\gexec

SELECT 'CREATE DATABASE notifications_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notifications_db')\gexec
