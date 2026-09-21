# Demonstrativo de Resultados do Exercício (DRE Gerencial)
## Fase 1.3.11.1.4.4

### 1. Arquitetura do DRE Gerencial
O DRE Gerencial fornece a visão analítica de rentabilidade por evento e consolidada por produtor, calculando o resultado operacional líquido a partir da receita de ingressos, deduções e custos diretos.

### 2. Estrutura das Linhas do Demonstrativo
```text
(+) RECEITA BRUTA DE INGRESSOS
(-) TAXAS DE SERVIÇO DA PLATAFORMA DISKINGRESSOS
(=) RECEITA OPERACIONAL LÍQUIDA
(-) CUSTOS DIRETOS DE PRODUÇÃO (Som, Luz, LED, Gerador, Brigada, Locação)
(-) CUSTOS DE MARKETING, TRÁFEGO PAGO & MÍDIA
(=) MARGEM DE CONTRIBUIÇÃO OPERACIONAL (EBITDA Operacional do Evento)
(-) IMPOSTOS E RETENÇÕES TRIBUTÁRIAS (ISS, PIS/COFINS, Retenções na Fonte)
(=) RESULTADO OPERACIONAL LÍQUIDO DO PRODUTOR
```

### 3. Fórmulas de Cálculo e Consistência Aritmética
- `Receita Líquida` = `Receita Bruta - Taxas de Serviço`
- `Margem de Contribuição` = `Receita Líquida - Custos Diretos - Custos de Marketing`
- `Resultado Operacional Líquido` = `Margem de Contribuição - Impostos e Retenções`
- Todos os cálculos são validados com arredondamento estrito de 2 casas decimais (`Number(val.toFixed(2))`) eliminando drift de ponto flutuante.
