import axios from 'axios'

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = data.detail
      if (typeof detail === 'string') return detail
    }
    if (!error.response) return 'No se pudo conectar con el servidor.'
  }
  return 'Ocurrió un error. Intentá de nuevo.'
}
