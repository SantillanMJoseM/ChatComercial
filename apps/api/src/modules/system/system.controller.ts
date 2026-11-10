import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const updateSchema = z.object({ value: z.any() });

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json(settings.map((s) => ({ key: s.key, value: s.isSecret ? null : s.value, isSecret: s.isSecret, updatedAt: s.updatedAt })));
  } catch (e) { next(e); }
}

export async function patchSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.params.key || req.body.key;
    const body = updateSchema.parse(req.body);
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value },
    });
    res.json({ key: setting.key, value: setting.isSecret ? null : setting.value, isSecret: setting.isSecret });
  } catch (e) { next(e); }
}
