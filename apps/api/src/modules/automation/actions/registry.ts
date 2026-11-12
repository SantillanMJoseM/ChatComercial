import { z } from 'zod';

export interface ActionDef { key: string; name: string; category: string; risk: 'READ' | 'INTERNAL_WRITE' | 'EXTERNAL_WRITE' | 'BULK'; schema: z.ZodTypeAny; }

export const ACTION_CATALOG: ActionDef[] = [
  { key: 'create_task', name: 'Crear tarea', category: 'crm', risk: 'INTERNAL_WRITE', schema: z.object({ title: z.string(), description: z.string().optional() }) },
  { key: 'update_client', name: 'Actualizar cliente', category: 'crm', risk: 'INTERNAL_WRITE', schema: z.object({ clientId: z.string().uuid(), data: z.any() }) },
  { key: 'create_note', name: 'Crear nota', category: 'crm', risk: 'INTERNAL_WRITE', schema: z.object({ clientId: z.string().uuid(), body: z.string() }) },
  { key: 'add_tag', name: 'Agregar etiqueta', category: 'crm', risk: 'INTERNAL_WRITE', schema: z.object({ clientId: z.string().uuid(), tag: z.string() }) },
  { key: 'remove_tag', name: 'Quitar etiqueta', category: 'crm', risk: 'INTERNAL_WRITE', schema: z.object({ clientId: z.string().uuid(), tag: z.string() }) },
  { key: 'assign_operator', name: 'Asignar operador', category: 'attention', risk: 'INTERNAL_WRITE', schema: z.object({ conversationId: z.string(), operatorId: z.string().uuid() }) },
  { key: 'assign_team', name: 'Asignar equipo', category: 'attention', risk: 'INTERNAL_WRITE', schema: z.object({ conversationId: z.string(), teamId: z.string().uuid() }) },
  { key: 'change_conversation_status', name: 'Cambiar estado conversación', category: 'attention', risk: 'INTERNAL_WRITE', schema: z.object({ conversationId: z.string(), status: z.string() }) },
  { key: 'handoff', name: 'Derivar', category: 'attention', risk: 'INTERNAL_WRITE', schema: z.object({ conversationId: z.string(), reason: z.string().optional() }) },
  { key: 'execute_skill', name: 'Ejecutar skill', category: 'intelligence', risk: 'READ', schema: z.object({ skillKey: z.string(), input: z.any().optional() }) },
  { key: 'query_rag', name: 'Consultar RAG', category: 'intelligence', risk: 'READ', schema: z.object({ query: z.string(), collectionIds: z.array(z.string().uuid()).optional() }) },
  { key: 'request_ai_assistance', name: 'Solicitar asistencia IA', category: 'intelligence', risk: 'READ', schema: z.object({ assistantKey: z.string(), query: z.string() }) },
  { key: 'send_whatsapp', name: 'Enviar WhatsApp', category: 'communication', risk: 'EXTERNAL_WRITE', schema: z.object({ session: z.string(), chatId: z.string(), text: z.string() }) },
  { key: 'send_notification', name: 'Enviar notificación', category: 'communication', risk: 'INTERNAL_WRITE', schema: z.object({ userId: z.string().uuid(), title: z.string(), body: z.string().optional() }) },
  { key: 'add_to_segment', name: 'Agregar a segmentación', category: 'segmentation', risk: 'INTERNAL_WRITE', schema: z.object({ segmentId: z.string().uuid(), clientId: z.string().uuid() }) },
  { key: 'generate_report', name: 'Generar reporte', category: 'system', risk: 'READ', schema: z.object({ reportId: z.string().uuid().optional(), params: z.any().optional() }) },
  { key: 'wait', name: 'Esperar', category: 'system', risk: 'READ', schema: z.object({ seconds: z.number().int().min(1).max(86400) }) },
];

export function getActionDef(key: string) { return ACTION_CATALOG.find((a) => a.key === key); }
