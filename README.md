# ChatComercial

Plataforma de gestión omnicanal para e-commerce y atención por IA. Simulador de WhatsApp + Backoffice completo.

## Stack
- React + Vite
- Tailwind CSS
- Base de datos interna (IndexedDB vía Dexie)

## Módulos
- Pedidos (Kanban drag-and-drop + lista)
- Chat Simulador (WhatsApp UI, audio, imágenes, reacciones, modo auto/manual)
- Entrenamiento IA (reglas de conocimiento)
- Productos (CRUD + importación masiva/URL simulada)
- Clientes (CRUD + toggle bot)
- Configuración (estados, horarios, tono, segmentación)

## Desarrollo
```bash
npm install
npm run dev
```

## Pruebas
```bash
npm test
npm run lint
npm run build
```

## Despliegue
Ver `DEPLOY.md`. Ejecutar `./deploy.sh`.