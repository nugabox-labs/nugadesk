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
  state?: string
  responseMode?: 'query' | 'fragment' | 'form_post' | 'web_message'
}

interface AppleSignInSuccessEvent extends CustomEvent {
  detail: {
    data?: AppleSignInResponse
    authorization?: AppleSignInResponse['authorization']
  }
}

interface AppleSignInFailureEvent extends CustomEvent {
  detail: {
    error: string
  }
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

const APPLE_AUTH_ACTION_KEY = 'nugadesk-apple-auth-action'
const APPLE_LOGIN_REMEMBER_KEY = 'nugadesk-apple-login-remember'

export type AppleAuthAction = 'login' | 'link'

let sdkLoadPromise: Promise<void> | null = null
let listenersAttached = false

export function appleRedirectOrigin(redirectUri: string): string {
  return new URL(redirectUri).origin
}

export function isAppleOriginAvailable(config: AppleAuthConfig | undefined): boolean {
  if (!config?.enabled || !config.redirect_uri) return false
  return window.location.origin === appleRedirectOrigin(config.redirect_uri)
}

export function setAppleAuthPending(action: AppleAuthAction, rememberMe = false): void {
  sessionStorage.setItem(APPLE_AUTH_ACTION_KEY, action)
  sessionStorage.setItem(APPLE_LOGIN_REMEMBER_KEY, rememberMe ? '1' : '0')
}

export function peekAppleAuthPending(): AppleAuthAction | null {
  const action = sessionStorage.getItem(APPLE_AUTH_ACTION_KEY)
  return action === 'login' || action === 'link' ? action : null
}

export function consumeAppleAuthPending(): { action: AppleAuthAction; rememberMe: boolean } | null {
  const action = peekAppleAuthPending()
  if (!action) return null
  const rememberMe = sessionStorage.getItem(APPLE_LOGIN_REMEMBER_KEY) === '1'
  sessionStorage.removeItem(APPLE_AUTH_ACTION_KEY)
  sessionStorage.removeItem(APPLE_LOGIN_REMEMBER_KEY)
  return { action, rememberMe }
}

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

export function initAppleAuth(clientId: string, redirectURI: string, usePopup: boolean): void {
  window.AppleID!.auth.init({
    clientId,
    scope: 'name email',
    redirectURI,
    usePopup,
    state: `nugadesk-${usePopup ? 'popup' : 'redirect'}`,
    // 리다이렉트 모드는 form_post(기본값) 대신 fragment — nginx 정적 서버가 POST /login 을 405로 거부함
    responseMode: usePopup ? 'web_message' : 'fragment',
  })
}

/** 리다이렉트 복귀 URL hash(#id_token=...)에서 id_token 추출 */
export function parseIdTokenFromFragment(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  return new URLSearchParams(hash).get('id_token')
}

export function clearAppleAuthFragment(): void {
  if (!window.location.hash) return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function redirectToAppleSignIn(clientId: string, redirectURI: string): void {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectURI,
    response_type: 'code id_token',
    response_mode: 'fragment',
    scope: 'name email',
    state: 'nugadesk-redirect',
  })
  window.location.assign(`https://appleid.apple.com/auth/authorize?${params}`)
}

export async function signInWithApple(): Promise<AppleSignInResponse> {
  await loadAppleSdk()
  if (!window.AppleID?.auth) {
    throw new Error('Apple SDK를 사용할 수 없습니다.')
  }
  return window.AppleID.auth.signIn()
}

function extractAuthorization(event: AppleSignInSuccessEvent): AppleSignInResponse['authorization'] | null {
  const data = event.detail.data
  if (data?.authorization?.id_token) return data.authorization
  if (event.detail.authorization?.id_token) return event.detail.authorization
  return null
}

export function attachAppleAuthListeners(
  onSuccess: (authorization: AppleSignInResponse['authorization']) => void,
  onFailure: (message: string) => void,
): void {
  if (listenersAttached) return
  listenersAttached = true

  document.addEventListener('AppleIDSignInOnSuccess', (event) => {
    const authorization = extractAuthorization(event as AppleSignInSuccessEvent)
    if (!authorization?.id_token) {
      onFailure('Apple 로그인 응답이 올바르지 않습니다.')
      return
    }
    onSuccess(authorization)
  })

  document.addEventListener('AppleIDSignInOnFailure', (event) => {
    const detail = (event as AppleSignInFailureEvent).detail
    onFailure(detail?.error || 'Apple 로그인에 실패했습니다.')
  })
}

export async function prepareAppleCallbackPage(
  clientId: string,
  redirectURI: string,
  usePopup: boolean,
): Promise<void> {
  await loadAppleSdk()
  initAppleAuth(clientId, redirectURI, usePopup)
}

export function isApplePopupCallback(): boolean {
  return window.opener != null && !window.opener.closed
}
