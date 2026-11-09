# Arquitectura

## Stack
- React 19 + Vite 5
- Tailwind CSS 3
- Dexie (IndexedDB) como base de datos interna del navegador

## Módulos
- `context/AppContext.jsx`: estado global y operaciones CRUD.
- `db/db.js`: esquema Dexie.
- `db/seed.js`: datos iniciales.
- `pages/*`: pantallas principales.
- `utils/ai.js`: motor local de respuestas y tono.
- `utils/speech.js`: reconocimiento de voz.

## Persistencia
Toda la información se almacena en IndexedDB del navegador. No hay backend.

## Limitaciones
- El entrenador no utiliza un LLM externo; aplica reglas locales y coincidencia de palabras clave.
- La importación por URL es simulada.