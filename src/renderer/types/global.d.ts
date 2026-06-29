import type { ClipCaptureAPI } from './index'

declare global {
  interface Window {
    clipCaptureAPI: ClipCaptureAPI
  }
}
