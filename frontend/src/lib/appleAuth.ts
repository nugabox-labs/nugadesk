/** Apple Sign In JS SDK (https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js) */

export interface AppleAuthConfig {
  enabled: boolean
  client_id: string | null
  redirect_uri: string | null
}

export interface AppleSignInResponse {
  authorization: {
    id_token: string
    code: string
    state?: string
  }
  user?: {
    email?: string
    name?: {
      firstName?: string
      lastName?: string
    }
  }
}

export interface AppleAuthInitConfig {
  clientId: string
  scope: string
  redirectURI: string
  usePopup: boolean
}

interface AppleAuthApi {
  init: (config: AppleAuthInitConfig) => void
  signIn: () => Promise<AppleSignInResponse>
}

declare global {
  interface Window {
    AppleID?: {
      auth: AppleAuthApi
    }
  }
}

const APPLE_SDK_URL =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

let sdkLoadPromise: Promise<void> | null = null

export function loadAppleSdk(): Promise<void> {
  if (window.AppleID?.auth) return Promise.resolve()
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Apple SDK 로드 실패')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = APPLE_SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Apple SDK 로드 실패'))
    document.head.appendChild(script)
  })

  return sdkLoadPromise
}

export function initAppleAuth(clientId: string, redirectURI: string): void {
  window.AppleID!.auth.init({
    clientId,
    scope: 'name email',
    redirectURI,
    usePopup: true,
  })
}

export async function signInWithApple(): Promise<AppleSignInResponse> {
  await loadAppleSdk()
  if (!window.AppleID?.auth) {
    throw new Error('Apple SDK를 사용할 수 없습니다.')
  }
  return window.AppleID.auth.signIn()
}
