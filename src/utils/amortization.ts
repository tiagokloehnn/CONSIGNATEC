/**
 * Motor Financeiro de Cálculo de Amortização (SAC e Tabela Price)
 * Suporta amortizações extraordinárias recorrentes e pontuais
 * com estratégias de Redução de Prazo e Redução de Parcela.
 */

export type AmortizationSystem = 'SAC' | 'PRICE';
export type AmortizationStrategy = 'REDUCE_TERM' | 'REDUCE_INSTALLMENT';

export interface OneTimeExtraPayment {
  id: string;
  month: number; // Mês em que o aporte ocorre (1, 2, 12, etc.)
  amount: number; // Valor do aporte em R$
  description?: string; // Ex: 'FGTS', '13º Salário', 'Bônus'
}

export interface AmortizationInput {
  saldoDevedor: number; // Saldo devedor atual (R$)
  prazoMeses: number; // Prazo total em meses
  taxaJurosAnual: number; // Taxa de juros anual em % (ex: 9.9)
  sistema: AmortizationSystem;
  estrategia: AmortizationStrategy;
  aporteMensalRecorrente: number; // Aporte extra todo mês (R$)
  aportesPontuais: OneTimeExtraPayment[]; // Aportes avulsos
  taxasMensaisFixas?: number; // Seguros MIP/DFI e taxa de administração (R$/mês)
}

export interface MonthlyAmortizationRecord {
  mes: number;
  saldoInicial: number;
  amortizacaoOrdinaria: number;
  amortizacaoExtra: number;
  amortizacaoTotal: number;
  juros: number;
  taxasSeguros: number;
  parcelaOrdinaria: number;
  parcelaTotalPaga: number;
  saldoFinal: number;
  detalheAporte?: string;
}

export interface AmortizationSimulationResult {
  // Cenário Original (sem nenhum aporte extra)
  cenarioOriginal: {
    totalPago: number;
    totalJuros: number;
    totalTaxasSeguros: number;
    prazoMeses: number;
    primeiraParcela: number;
    ultimaParcela: number;
  };
  // Cenário Com Amortização Extraordinária
  cenarioAmortizado: {
    totalPago: number;
    totalJuros: number;
    totalAmortizacaoExtra: number;
    totalTaxasSeguros: number;
    prazoMesesReal: number;
    primeiraParcela: number;
    ultimaParcela: number;
  };
  // Comparativo e Economia
  comparativo: {
    economiaJuros: number; // R$ poupados em juros
    economiaTotal: number; // R$ total a menos que sai do bolso
    mesesEconomizados: number; // Meses cortados do financiamento
    anosEconomizados: number; // Anos aproximados
    mesesRestantes: number;
    percentualEconomiaJuros: number;
    multiplicadorRetorno: number; // Para cada R$ 1 de aporte extra, quanto economizou em juros
    reducaoParcelaMedia?: number;
  };
  cronogramaAmortizado: MonthlyAmortizationRecord[];
  cronogramaOriginal: MonthlyAmortizationRecord[];
}

/**
 * Converte taxa de juros anual nominal para taxa mensal efetiva
 * Fórmula financeira: i_m = (1 + i_a)^(1/12) - 1
 */
export function convertAnnualToMonthlyRate(annualRatePercent: number): number {
  const i_a = annualRatePercent / 100;
  return Math.pow(1 + i_a, 1 / 12) - 1;
}

/**
 * Calcula a prestação fixa na Tabela Price
 * PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
 */
export function calculatePriceInstallment(pv: number, i: number, n: number): number {
  if (pv <= 0 || n <= 0) return 0;
  if (i === 0) return pv / n;
  const factor = Math.pow(1 + i, n);
  return (pv * (i * factor)) / (factor - 1);
}

/**
 * Simula a evolução completa do financiamento mês a mês
 */
export function simulateAmortization(input: AmortizationInput): AmortizationSimulationResult {
  const {
    saldoDevedor: pvOriginal,
    prazoMeses: nOriginal,
    taxaJurosAnual,
    sistema,
    estrategia,
    aporteMensalRecorrente = 0,
    aportesPontuais = [],
    taxasMensaisFixas = 0,
  } = input;

  // Safe zero state guard for new accounts or zeroed simulation
  if (!pvOriginal || pvOriginal <= 0 || !nOriginal || nOriginal <= 0) {
    return {
      cenarioOriginal: {
        totalPago: 0,
        totalJuros: 0,
        totalTaxasSeguros: 0,
        prazoMeses: 0,
        primeiraParcela: 0,
        ultimaParcela: 0,
      },
      cenarioAmortizado: {
        totalPago: 0,
        totalJuros: 0,
        totalAmortizacaoExtra: 0,
        totalTaxasSeguros: 0,
        prazoMesesReal: 0,
        primeiraParcela: 0,
        ultimaParcela: 0,
      },
      comparativo: {
        economiaJuros: 0,
        economiaTotal: 0,
        mesesEconomizados: 0,
        anosEconomizados: 0,
        mesesRestantes: 0,
        percentualEconomiaJuros: 0,
        multiplicadorRetorno: 0,
        reducaoParcelaMedia: 0,
      },
      cronogramaAmortizado: [],
      cronogramaOriginal: [],
    };
  }

  const taxaMensal = convertAnnualToMonthlyRate(taxaJurosAnual);

  // Mapear aportes pontuais por mês
  const mapAportesPontuais: Record<number, { amount: number; desc: string }> = {};
  aportesPontuais.forEach((ap) => {
    if (ap.amount > 0 && ap.month > 0) {
      if (!mapAportesPontuais[ap.month]) {
        mapAportesPontuais[ap.month] = { amount: 0, desc: ap.description || 'Aporte Extra' };
      }
      mapAportesPontuais[ap.month].amount += ap.amount;
    }
  });

  // ==========================================
  // 1. Simulação do Cenário Original (Sem Aportes)
  // ==========================================
  let saldoOriginal = pvOriginal;
  let totalJurosOriginal = 0;
  let totalTaxasOriginal = 0;
  let totalPagoOriginal = 0;
  const cronogramaOriginal: MonthlyAmortizationRecord[] = [];

  let pmtPriceOriginal =
    sistema === 'PRICE' ? calculatePriceInstallment(saldoOriginal, taxaMensal, nOriginal) : 0;

  for (let mes = 1; mes <= nOriginal && saldoOriginal > 0.001; mes++) {
    const saldoInicial = saldoOriginal;
    const jurosMes = saldoInicial * taxaMensal;
    totalJurosOriginal += jurosMes;
    totalTaxasOriginal += taxasMensaisFixas;

    let amortizacaoMes = 0;
    let parcelaOrdinaria = 0;

    if (sistema === 'SAC') {
      const mesesRestantes = nOriginal - mes + 1;
      amortizacaoMes = saldoInicial / mesesRestantes;
      parcelaOrdinaria = amortizacaoMes + jurosMes;
    } else {
      // PRICE
      parcelaOrdinaria = pmtPriceOriginal;
      amortizacaoMes = Math.min(saldoInicial, Math.max(0, parcelaOrdinaria - jurosMes));
    }

    if (amortizacaoMes > saldoInicial) {
      amortizacaoMes = saldoInicial;
    }

    const saldoFinal = Math.max(0, saldoInicial - amortizacaoMes);
    const parcelaTotalPaga = parcelaOrdinaria + taxasMensaisFixas;
    totalPagoOriginal += parcelaTotalPaga;
    saldoOriginal = saldoFinal;

    cronogramaOriginal.push({
      mes,
      saldoInicial,
      amortizacaoOrdinaria: amortizacaoMes,
      amortizacaoExtra: 0,
      amortizacaoTotal: amortizacaoMes,
      juros: jurosMes,
      taxasSeguros: taxasMensaisFixas,
      parcelaOrdinaria,
      parcelaTotalPaga,
      saldoFinal,
    });
  }

  // ==========================================
  // 2. Simulação com Amortizações Extraordinárias
  // ==========================================
  let saldoAmortizado = pvOriginal;
  let totalJurosAmortizado = 0;
  let totalTaxasAmortizado = 0;
  let totalPagoAmortizado = 0;
  let totalAmortizacaoExtra = 0;
  const cronogramaAmortizado: MonthlyAmortizationRecord[] = [];

  let pmtPriceDinamico =
    sistema === 'PRICE' ? calculatePriceInstallment(saldoAmortizado, taxaMensal, nOriginal) : 0;

  let mesAtual = 1;
  const maxMesesSeguranca = nOriginal * 2;

  while (saldoAmortizado > 0.001 && mesAtual <= maxMesesSeguranca) {
    const mesesRestantesPrazo = Math.max(1, nOriginal - mesAtual + 1);
    const saldoInicial = saldoAmortizado;
    const jurosMes = saldoInicial * taxaMensal;
    totalJurosAmortizado += jurosMes;
    totalTaxasAmortizado += taxasMensaisFixas;

    // Calcular amortização ordinária da parcela regular
    let amortizacaoOrdinaria = 0;
    let parcelaOrdinaria = 0;

    if (sistema === 'SAC') {
      if (estrategia === 'REDUCE_TERM') {
        // Redução de prazo: a amortização mensal continua a programada originalmente
        // A = PV_original / n_original
        amortizacaoOrdinaria = Math.min(saldoInicial, pvOriginal / nOriginal);
      } else {
        // Redução de parcela: recalcula a amortização dividindo pelo prazo restante
        amortizacaoOrdinaria = Math.min(saldoInicial, saldoInicial / mesesRestantesPrazo);
      }
      parcelaOrdinaria = amortizacaoOrdinaria + jurosMes;
    } else {
      // PRICE
      if (estrategia === 'REDUCE_TERM') {
        // Mantém a PMT original fixada
        parcelaOrdinaria = pmtPriceOriginal;
        amortizacaoOrdinaria = Math.min(saldoInicial, Math.max(0, parcelaOrdinaria - jurosMes));
      } else {
        // Redução de parcela: recalcula PMT para o novo saldo com prazo restante
        pmtPriceDinamico = calculatePriceInstallment(saldoInicial, taxaMensal, mesesRestantesPrazo);
        parcelaOrdinaria = pmtPriceDinamico;
        amortizacaoOrdinaria = Math.min(saldoInicial, Math.max(0, parcelaOrdinaria - jurosMes));
      }
    }

    // Saldo após a amortização regular da parcela
    let saldoAposRegular = Math.max(0, saldoInicial - amortizacaoOrdinaria);

    // Calcular aportes extraordinários deste mês
    let aporteDoMes = aporteMensalRecorrente;
    let detalheAporte = '';

    const pontual = mapAportesPontuais[mesAtual];
    if (pontual && pontual.amount > 0) {
      aporteDoMes += pontual.amount;
      detalheAporte = pontual.desc;
    }

    // O aporte não pode ultrapassar o saldo restante
    const amortizacaoExtra = Math.min(saldoAposRegular, aporteDoMes);
    totalAmortizacaoExtra += amortizacaoExtra;

    const amortizacaoTotal = amortizacaoOrdinaria + amortizacaoExtra;
    const saldoFinal = Math.max(0, saldoInicial - amortizacaoTotal);

    const parcelaTotalPaga = parcelaOrdinaria + amortizacaoExtra + taxasMensaisFixas;
    totalPagoAmortizado += parcelaTotalPaga;
    saldoAmortizado = saldoFinal;

    cronogramaAmortizado.push({
      mes: mesAtual,
      saldoInicial,
      amortizacaoOrdinaria,
      amortizacaoExtra,
      amortizacaoTotal,
      juros: jurosMes,
      taxasSeguros: taxasMensaisFixas,
      parcelaOrdinaria,
      parcelaTotalPaga,
      saldoFinal,
      detalheAporte: detalheAporte || (amortizacaoExtra > 0 ? 'Aporte Mensal' : undefined),
    });

    if (saldoFinal <= 0.001) {
      break;
    }

    mesAtual++;
  }

  // ==========================================
  // 3. Métricas Comparativas
  // ==========================================
  const prazoMesesReal = cronogramaAmortizado.length;
  const mesesEconomizados = Math.max(0, cronogramaOriginal.length - prazoMesesReal);
  const anosEconomizados = Math.floor(mesesEconomizados / 12);
  const economiaJuros = Math.max(0, totalJurosOriginal - totalJurosAmortizado);
  const economiaTotal = Math.max(0, totalPagoOriginal - totalPagoAmortizado);
  const percentualEconomiaJuros =
    totalJurosOriginal > 0 ? (economiaJuros / totalJurosOriginal) * 100 : 0;

  const multiplicadorRetorno =
    totalAmortizacaoExtra > 0 ? (economiaJuros / totalAmortizacaoExtra) : 0;

  const primeiraParcelaOriginal = cronogramaOriginal[0]?.parcelaTotalPaga || 0;
  const ultimaParcelaOriginal =
    cronogramaOriginal[cronogramaOriginal.length - 1]?.parcelaTotalPaga || 0;

  const primeiraParcelaAmortizada = cronogramaAmortizado[0]?.parcelaTotalPaga || 0;
  const ultimaParcelaAmortizada =
    cronogramaAmortizado[cronogramaAmortizado.length - 1]?.parcelaTotalPaga || 0;

  return {
    cenarioOriginal: {
      totalPago: totalPagoOriginal,
      totalJuros: totalJurosOriginal,
      totalTaxasSeguros: totalTaxasOriginal,
      prazoMeses: cronogramaOriginal.length,
      primeiraParcela: primeiraParcelaOriginal,
      ultimaParcela: ultimaParcelaOriginal,
    },
    cenarioAmortizado: {
      totalPago: totalPagoAmortizado,
      totalJuros: totalJurosAmortizado,
      totalAmortizacaoExtra,
      totalTaxasSeguros: totalTaxasAmortizado,
      prazoMesesReal,
      primeiraParcela: primeiraParcelaAmortizada,
      ultimaParcela: ultimaParcelaAmortizada,
    },
    comparativo: {
      economiaJuros,
      economiaTotal,
      mesesEconomizados,
      anosEconomizados,
      mesesRestantes: mesesEconomizados % 12,
      percentualEconomiaJuros,
      multiplicadorRetorno,
    },
    cronogramaAmortizado,
    cronogramaOriginal,
  };
}

/**
 * Gera string CSV formatada para download da tabela de amortização
 */
export function exportAmortizationToCSV(
  simulation: AmortizationSimulationResult,
  input: AmortizationInput
): string {
  const headers = [
    'Mês',
    'Saldo Devedor Inicial (R$)',
    'Amortização Ordinária (R$)',
    'Amortização Extraordinária (R$)',
    'Amortização Total (R$)',
    'Juros do Mês (R$)',
    'Taxas / Seguros (R$)',
    'Parcela Total Paga (R$)',
    'Saldo Devedor Final (R$)',
    'Detalhe do Aporte',
  ];

  const rows = simulation.cronogramaAmortizado.map((row) => [
    row.mes,
    row.saldoInicial.toFixed(2),
    row.amortizacaoOrdinaria.toFixed(2),
    row.amortizacaoExtra.toFixed(2),
    row.amortizacaoTotal.toFixed(2),
    row.juros.toFixed(2),
    row.taxasSeguros.toFixed(2),
    row.parcelaTotalPaga.toFixed(2),
    row.saldoFinal.toFixed(2),
    `"${row.detalheAporte || ''}"`,
  ]);

  const summary = [
    ['--- RESUMO DA SIMULAÇÃO CONSIGNATEC ---'],
    ['Sistema:', input.sistema],
    ['Estratégia:', input.estrategia === 'REDUCE_TERM' ? 'Redução de Prazo' : 'Redução de Parcela'],
    ['Saldo Devedor Inicial:', `R$ ${input.saldoDevedor.toFixed(2)}`],
    ['Taxa Anual:', `${input.taxaJurosAnual.toFixed(2)}% a.a.`],
    ['Prazo Original:', `${simulation.cenarioOriginal.prazoMeses} meses`],
    ['Prazo Final com Amortização:', `${simulation.cenarioAmortizado.prazoMesesReal} meses`],
    ['Economia Total em Juros:', `R$ ${simulation.comparativo.economiaJuros.toFixed(2)}`],
    ['Meses Economizados:', `${simulation.comparativo.mesesEconomizados} meses`],
    ['---------------------------------------'],
    [],
  ];

  const csvContent =
    summary.map((r) => r.join(';')).join('\n') +
    '\n' +
    [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

  return csvContent;
}
