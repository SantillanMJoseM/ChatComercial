# F5.1 — Propuesta de modelo de datos (borrador)

## Nuevas entidades
- KnowledgeCollection
- KnowledgeDocument
- KnowledgeDocumentVersion
- KnowledgeChunk
- KnowledgeEmbedding
- KnowledgeProcessingJob
- KnowledgeSourceReference
- AIAssistantKnowledge
- Skill
- SkillVersion
- SkillExecution
- SkillToolPermission

Ver esquema en migración. Embedding almacenado como Unsupported("vector") con dimensión registrada en KnowledgeEmbedding.dimension y modelo.
