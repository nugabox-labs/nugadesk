/** Apple Sign In JS SDK (https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js) */

export interface AppleAuthConfig {
  enabled: boolean
  client_id: string | null
  redirect_uri: string | null
  login_redirect_uri: string | null
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

export function appleRedirectOrigin(redirectUri: string): string {
  return new URL(redirectUri).origin
}

export function isAppleOriginAvailable(config: AppleAuthConfig | undefined): boolean {
  if (!config?.enabled || !config.redirect_uri) return false
  return window.location.origin === appleRedirectOrigin(config.redirect_uri)
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
    // 팝업 모드는 web_message(Apple이 postMessage로 opener에 직접 전달, redirect_uri는 origin
    // 검증용). scope에 name/email이 있으면 fragment/query는 Apple이 invalid_request로 거부하므로
    // 팝업이 아닌 전체 리다이렉트 로그인은 이 SDK가 아니라 redirectToAppleSignIn()의
    // response_mode=form_post 경로를 쓴다 — 이 함수는 팝업(설정 연결) 전용이라고 보면 된다.
    responseMode: 'web_message',
  })
}

/**
 * scope에 name/email을 요청하면 Apple은 response_mode=form_post만 허용한다(fragment/query는
 * invalid_request). loginRedirectURI는 그 POST를 받을 수 있는 /api/ 하위 백엔드 콜백이어야 한다
 * — 정적 파일만 서빙하는 프론트 경로(`/login`)로 두면 405가 난다.
 */
export function redirectToAppleSignIn(clientId: string, loginRedirectURI: string, rememberMe: boolean): void {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: loginRedirectURI,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state: `nugadesk-login-remember-${rememberMe ? '1' : '0'}`,
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
