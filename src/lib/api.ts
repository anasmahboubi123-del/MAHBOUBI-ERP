// ════════════════════════════════════════════════════════════════
// src/lib/api.ts
// معالج API موحد — يتعامل مع الأخطاء بشكل صحيح
// ════════════════════════════════════════════════════════════════

/**
 * نتيجة API موحدة — تُستخدم في كل API Routes
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * خطأ API مخصص — يحمل رمز الحالة ورسالة واضحة
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * يتحقق من رد HTTP ويرمي ApiError إذا فشل
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData.code
    )
  }
  return response.json() as Promise<T>
}

/**
 * ينشئ رد نجاح موحد
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

/**
 * ينشئ رد خطأ موحد
 */
export function createErrorResponse(error: string, code?: string): ApiResponse<never> {
  return { success: false, error, code }
}

/**
 * ينشئ رد استجابة Next.js موحد
 */
export function createJsonResponse<T>(response: ApiResponse<T>, status: number = 200): Response {
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}