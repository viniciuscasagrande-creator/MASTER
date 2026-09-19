import { prisma } from '../../../core/database/prisma';
import { auditService } from '../../audit/audit.service';

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  idempotencyKey?: string;
  resultData?: any;
  error?: string;
}

export class ExecutionService {
  private executedKeys: Map<string, ExecutionResult> = new Map();

  /**
   * Executes the approved operation.
   * Completely isolated from the approval process to ensure audit immutability.
   */
  async executeApprovedRequest(
    requestId: string,
    executorUserId: string,
    idempotencyKey?: string
  ): Promise<ExecutionResult> {
    // 1. Check idempotency
    if (idempotencyKey && this.executedKeys.has(idempotencyKey)) {
      const cached = this.executedKeys.get(idempotencyKey)!;
      return cached;
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: true, decisions: true }
    });

    if (!request) {
      throw new Error('Solicitação de aprovação não encontrada.');
    }

    if (request.status !== 'APPROVED') {
      throw new Error(`Apenas solicitações com status APPROVED podem ser executadas. Status atual: ${request.status}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Update execution status to PROCESSING
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        executionStatus: 'PROCESSING',
        executionId
      }
    });

    try {
      let payload: any = {};
      if (typeof request.payload === 'string') {
        try {
          payload = JSON.parse(request.payload);
        } catch {
          payload = {};
        }
      } else {
        payload = request.payload || {};
      }

      // If simulated failure requested in payload
      if (payload.simulateExecutionFailure) {
        throw new Error('Falha simulada na execução do gateway bancário / ERP externo.');
      }

      let resultData: any = {};

      switch (request.operation) {
        case 'FINANCE_TRANSFER':
        case 'FINANCE_PAYOUT': {
          // Execute transfer
          const payment = await prisma.payment.create({
            data: {
              orderId: payload.orderId || 'ord_payout',
              amount: request.amount || 0,
              method: 'PIX',
              status: 'COMPLETED',
              transactionId: `TRX-EXEC-${Date.now()}`
            }
          });
          resultData = { transferExecuted: true, paymentId: payment.id, amount: request.amount };
          break;
        }

        case 'REFUND_REQUEST': {
          // Mark refund as completed
          if (payload.refundId) {
            await prisma.refund.update({
              where: { id: payload.refundId },
              data: { status: 'COMPLETED' }
            });
          }
          resultData = { refundExecuted: true, refundId: payload.refundId };
          break;
        }

        case 'ADMIN_ROLE_CHANGE': {
          // Grant target role
          if (payload.targetUserId && payload.newRoleId) {
            await prisma.userRole.create({
              data: {
                userId: payload.targetUserId,
                roleId: payload.newRoleId
              }
            });
          }
          resultData = { roleAssigned: true, targetUserId: payload.targetUserId };
          break;
        }

        default: {
          resultData = { executed: true, operation: request.operation, timestamp: new Date().toISOString() };
          break;
        }
      }

      // Mark request execution as SUCCESS
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          executionStatus: 'SUCCESS',
          executedAt: new Date()
        }
      });

      const result: ExecutionResult = {
        success: true,
        executionId,
        idempotencyKey,
        resultData
      };

      if (idempotencyKey) {
        this.executedKeys.set(idempotencyKey, result);
      }

      await auditService.log({
        userId: executorUserId,
        action: 'APPROVAL_REQUEST_EXECUTED',
        resource: 'approval_request',
        resourceId: requestId,
        details: { executionId, operation: request.operation, resultData }
      });

      return result;
    } catch (err: any) {
      // Upon failure: record failure without mutating approval status
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          executionStatus: 'FAILED',
          executionError: err.message
        }
      });

      await auditService.log({
        userId: executorUserId,
        action: 'APPROVAL_EXECUTION_FAILED',
        resource: 'approval_request',
        resourceId: requestId,
        details: { executionId, error: err.message }
      });

      const failureResult: ExecutionResult = {
        success: false,
        executionId,
        idempotencyKey,
        error: err.message
      };

      return failureResult;
    }
  }
}

export const executionService = new ExecutionService();
