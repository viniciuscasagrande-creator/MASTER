import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Status & Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Disk Interno PDT Core API',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    coreChain: 'Produtor -> Evento -> Cliente -> Pedido -> Ingresso -> Pagamento -> Repasse'
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Disk Interno Core API] Rodando na porta ${port}`);
  });
}

export default app;
