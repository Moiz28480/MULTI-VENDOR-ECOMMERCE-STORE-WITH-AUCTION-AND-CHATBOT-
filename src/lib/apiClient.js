export const apiClient = {
    put: async (path, payload) => {
        const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

        if (!baseUrl) {
            return {
                data: null,
                status: 204,
            };
        }

        const response = await fetch(`${baseUrl}${path}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            throw new Error(data?.message || `Request failed with status ${response.status}`);
        }

        return {
            data,
            status: response.status,
        };
    },
};
