import app from './app';

const port = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[Disk Interno Backend] Modular Monolith online na porta ${port}`);
    console.log(`[Segurança] RBAC e Isolamento de Escopo ativados.`);
  });
}

export default app;
