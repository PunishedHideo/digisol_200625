import { Request, Response } from 'express';
import { ClientInfoServiceGet, ClientInfoServicePost } from './service.js';
import path from 'path';

export async function DashboardController(
  req: Request,
  res: Response,
): Promise<void> {
  if (req) {
    res.status(200).sendFile(path.resolve('src/client/private/index.html'));
  }
}

export async function ClientInfoControllerGet(
  req: Request,
  res: Response,
): Promise<void> {
  if (req) {
    const page = parseInt(req.query.page as string) || 0;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search || '';

    let order: number[] = [];
    if (req.query.order) {
      order = JSON.parse(req.query.order as string);
    }
    const info = await ClientInfoServiceGet(page, pageSize, search, order);
    res.status(200).json(info);
  }
}

export async function ClientInfoControllerPost(
  req: Request,
  res: Response,
): Promise<void> {
  if (req) {
    const result = await ClientInfoServicePost(req.body);
    res.status(200).json(result);
  }
}
