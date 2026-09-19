import { ObservabilitySeverity } from '../../../../shared/types/index';

export interface ErrorDefinition {
  code: string;
  severity: ObservabilitySeverity;
  userFriendlyMessage: string;
  technicalDescription: string;
  httpStatus: number;
}

export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  AUTH_INVALID_SESSION: {
    code: 'AUTH_INVALID_SESSION',
    severity: 'MEDIUM',
    userFriendlyMessage: 'Sua sessão expirou ou é inválida. Por favor, realize novo login.',
    technicalDescription: 'Token JWT expirado, ausente ou revogado no Redis/banco.',
    httpStatus: 401
  },
  AUTH_PERMISSION_DENIED: {
    code: 'AUTH_PERMISSION_DENIED',
    severity: 'MEDIUM',
    userFriendlyMessage: 'Você não possui permissão para executar esta operação.',
    technicalDescription: 'Usuário não possui a role ou permissão exigida no RBAC.',
    httpStatus: 403
  },
  SCOPE_ACCESS_DENIED: {
    code: 'SCOPE_ACCESS_DENIED',
    severity: 'HIGH',
    userFriendlyMessage: 'Acesso negado aos recursos deste produtor ou evento.',
    technicalDescription: 'Tentativa de acesso a recurso fora do escopo de Produtor ou Evento autorizado.',
    httpStatus: 403
  },
  FINANCE_INSUFFICIENT_BALANCE: {
    code: 'FINANCE_INSUFFICIENT_BALANCE',
    severity: 'HIGH',
    userFriendlyMessage: 'Saldo insuficiente para realizar a transferência ou repasse solicitado.',
    technicalDescription: 'Valor da operação excede o saldo disponível do produtor/evento deduzida a garantia.',
    httpStatus: 400
  },
  FINANCE_TRANSFER_FAILED: {
    code: 'FINANCE_TRANSFER_FAILED',
    severity: 'CRITICAL',
    userFriendlyMessage: 'Não foi possível concluir a transferência bancária neste momento. Tente novamente mais tarde.',
    technicalDescription: 'Falha durante chamada ao adaptador SPI/PIX do parceiro bancário.',
    httpStatus: 502
  },
  APPROVAL_REQUIRED: {
    code: 'APPROVAL_REQUIRED',
    severity: 'LOW',
    userFriendlyMessage: 'Esta operação requer aprovação prévia de alçada superior antes da execução.',
    technicalDescription: 'Policy Engine determinou obrigatoriedade de solicitação de aprovação.',
    httpStatus: 400
  },
  APPROVAL_INVALID_STATE: {
    code: 'APPROVAL_INVALID_STATE',
    severity: 'MEDIUM',
    userFriendlyMessage: 'A solicitação de aprovação não está em um estado que permite esta ação.',
    technicalDescription: 'Tentativa de aprovar, rejeitar ou cancelar solicitação já decidida ou expirada.',
    httpStatus: 409
  },
  DOCUMENT_SECURITY_REJECTED: {
    code: 'DOCUMENT_SECURITY_REJECTED',
    severity: 'CRITICAL',
    userFriendlyMessage: 'O arquivo enviado foi rejeitado pela análise de segurança da plataforma.',
    technicalDescription: 'Detecção de executável malicioso, hash blacklist ou teste EICAR durante inspeção.',
    httpStatus: 400
  },
  INTEGRATION_TIMEOUT: {
    code: 'INTEGRATION_TIMEOUT',
    severity: 'HIGH',
    userFriendlyMessage: 'O serviço externo não respondeu no tempo esperado. Nossa equipe técnica já foi notificada.',
    technicalDescription: 'Timeout de rede configurado estourado ao conectar com adaptador externo.',
    httpStatus: 504
  },
  INTEGRATION_AUTH_FAILED: {
    code: 'INTEGRATION_AUTH_FAILED',
    severity: 'HIGH',
    userFriendlyMessage: 'Não foi possível autenticar a integração com o parceiro. Verifique as credenciais.',
    technicalDescription: 'Credenciais OAuth/Token do adaptador externo expiradas ou inválidas.',
    httpStatus: 502
  },
  WEBHOOK_INVALID_SIGNATURE: {
    code: 'WEBHOOK_INVALID_SIGNATURE',
    severity: 'HIGH',
    userFriendlyMessage: 'A assinatura do webhook recebido é inválida.',
    technicalDescription: 'Falha de validação HMAC-SHA256 da assinatura no cabeçalho do webhook.',
    httpStatus: 401
  },
  TASK_SLA_EXPIRED: {
    code: 'TASK_SLA_EXPIRED',
    severity: 'MEDIUM',
    userFriendlyMessage: 'O prazo de atendimento desta tarefa foi excedido.',
    technicalDescription: 'Data limite calculada pela política de SLA foi ultrapassada.',
    httpStatus: 400
  },
  DATABASE_TIMEOUT: {
    code: 'DATABASE_TIMEOUT',
    severity: 'CRITICAL',
    userFriendlyMessage: 'O banco de dados demorou para responder. Operação abortada para sua segurança.',
    technicalDescription: 'Pool de conexões esgotado ou query demorou mais que statement_timeout.',
    httpStatus: 503
  },
  PAYMENT_PROVIDER_ERROR: {
    code: 'PAYMENT_PROVIDER_ERROR',
    severity: 'HIGH',
    userFriendlyMessage: 'Houve uma instabilidade no processador de pagamentos. Nenhuma cobrança foi efetuada.',
    technicalDescription: 'Gateway de pagamento retornou erro 5xx ou recusa de processamento de lote.',
    httpStatus: 502
  }
};
