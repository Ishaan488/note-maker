// Always use relative URL — Next.js rewrites proxy this to the backend
const API_URL = '/api';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export const api = {
    async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const headers = new Headers(options.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let message = 'API request failed';
            try {
                const data = await response.json();
                message = data.error || message;
            } catch (e) {
                // failed to parse json error
            }

            // If unauthorized, clear token and maybe redirect
            if (response.status === 401 && typeof window !== 'undefined') {
                localStorage.removeItem('token');
                if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
                    window.location.href = '/login';
                }
            }

            throw new ApiError(response.status, message);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    },

    get<T>(endpoint: string, options?: RequestInit) {
        return this.fetch<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, body: any, options?: RequestInit) {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put<T>(endpoint: string, body: any, options?: RequestInit) {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete<T>(endpoint: string, options?: RequestInit) {
        return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
    },
};
