import apiClient from './client';

/**
 * Сервис для работы с жалобами.
 */

export interface CreateReportRequest {
  entityType: 'USER' | 'SELLER' | 'OFFER' | 'REVIEW';
  entityId: number;
  reportType: 'SPAM' | 'HARASSMENT' | 'COUNTERFEIT' | 'RULE_VIOLATION' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
  reason?: string;
}

export interface ReportResponse {
  id: number;
  reporterUserId: number;
  entityType: string;
  entityId: number;
  reportType: string;
  reason?: string;
  status: string;
  moderationItemId: number;
  reviewedBy?: number;
  reviewedAt?: string;
  moderatorComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStatsDto {
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  reportsByType: Record<string, number>;
  aboveThreshold: boolean;
}

export const reportService = {
  /**
   * Создать жалобу.
   */
  async createReport(request: CreateReportRequest): Promise<ReportResponse> {
    const response = await apiClient.post<ReportResponse>('/api/reports', request);
    return response.data;
  },

  /**
   * Отозвать жалобу.
   */
  async withdrawReport(reportId: number): Promise<void> {
    await apiClient.post(`/api/reports/${reportId}/withdraw`);
  },

  /**
   * Получить историю жалоб на сущность (для модераторов).
   */
  async getReportsForEntity(
    entityType: string,
    entityId: number,
    page: number = 0,
    size: number = 20
  ): Promise<ReportResponse[]> {
    const response = await apiClient.get<{ items: ReportResponse[] }>(
      `/api/reports/entity/${entityType}/${entityId}`,
      { params: { page, size } }
    );
    return response.data.items ?? [];
  },

  /**
   * Получить статистику жалоб по сущности (для модераторов).
   */
  async getReportStats(entityType: string, entityId: number): Promise<ReportStatsDto> {
    const response = await apiClient.get<ReportStatsDto>(
      `/api/reports/entity/${entityType}/${entityId}/stats`
    );
    return response.data;
  },

  /**
   * Получить жалобы в статусе PENDING (для модераторов).
   */
  async getPendingReports(page: number = 0, size: number = 20): Promise<ReportResponse[]> {
    const response = await apiClient.get<{ items: ReportResponse[] }>(
      '/api/reports/pending',
      { params: { page, size } }
    );
    return response.data.items ?? [];
  },

  /**
   * Одобрить жалобу (модератором).
   */
  async approveReport(reportId: number, comment?: string): Promise<void> {
    await apiClient.post(`/api/reports/${reportId}/approve`, null, {
      params: comment ? { comment } : undefined,
    });
  },

  /**
   * Отклонить жалобу (модератором).
   */
  async rejectReport(reportId: number, comment?: string): Promise<void> {
    await apiClient.post(`/api/reports/${reportId}/reject`, null, {
      params: comment ? { comment } : undefined,
    });
  },
};
