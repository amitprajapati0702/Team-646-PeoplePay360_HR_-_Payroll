export interface ApiResponseOptions<T> {
    success?: boolean;
    message?: string;
    data?: T | null;
    meta?: Record<string, unknown> | null;
}

export class ApiResponse<T> {
    public readonly success: boolean;

    public readonly message: string;

    public readonly data: T | null;

    public readonly meta: Record<string, unknown> | null;

    constructor({
        success = true,
        message = 'Success',
        data = null,
        meta = null,
    }: ApiResponseOptions<T> = {}) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }
}

export default ApiResponse;