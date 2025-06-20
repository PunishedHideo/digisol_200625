import { Request, Response } from 'express';
import { ClientInfoServiceGet, ClientInfoServicePost } from './service.js';
import path from 'path';

export async function DashboardController(
  req: Request,
  res: Response,
): Promise<void> {
  res.status(200).sendFile(path.resolve('src/client/private/index.html')); // make paths
}

export async function ClientInfoControllerGet(req: Request, res: Response): Promise<void> {
    // console.log(req.query.page)
    const info = await ClientInfoServiceGet();
    res.status(200).send(JSON.stringify(info))
    // get the info from client with search and selected result
}

export async function ClientInfoControllerPost(req: Request, res: Response): Promise<void> {
    // console.log(req.body.selectedIds)
    const result = await ClientInfoServicePost(req.body.filteredData, req.body.displayedData, req.body.selectedIdsArray, req.body.customOrder);
    res.status(200).send(JSON.stringify(result))
    // get the info from client with search and selected result
}
