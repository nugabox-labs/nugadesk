import clsx from 'clsx'

import { FaIcon } from './FaIcon'

interface AppleSignInButtonProps {
  label?: string
  pending?: boolean
  disabled?: boolean
  disabledHint?: string
  className?: string
  onClick?: () => void
}

export function AppleSignInButton({
  label = 'Apple로 로그인',
  pending = false,
  disabled = false,
  disabledHint,
  className,
  onClick,
}: AppleSignInButtonProps) {
  return (
    <button
      type="button"
      className={clsx('btn btn-apple btn-lg w-full', className)}
      onClick={onClick}
      disabled={disabled || pending}
      title={disabled && disabledHint ? disabledHint : undefined}
    >
      {pending ? (
        'Apple 로그인 중...'
      ) : (
        <>
          <FaIcon name="apple" brand className="text-lg" />
          {label}
        </>
      )}
    </button>
  )
}
