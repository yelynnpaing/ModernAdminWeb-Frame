import { useToast } from 'vue-toastification'
export function useNotification () {
  const toast = useToast()
  function showNotification (text, color = 'success') {
    const type = String(color || 'info').toLowerCase()
    const method = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info'
    const message = Array.isArray(text) ? text.join(' ') : String(text || (method === 'error' ? 'Request failed' : 'Completed'))
    toast[method](message)
  }
  return { showNotification }
}
