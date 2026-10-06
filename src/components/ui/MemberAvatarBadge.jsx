import React from 'react'
import { Crown, Zap, Flame, Sparkles, Sprout } from 'lucide-react'

export function getMemberTierInfo(member) {
  const handle = String(member?.handle || '').toUpperCase()
  const isAdminAccount = handle === 'LIT'

  // 공식 관리국(LIT) 대표 계정은 별도 챌린지 뱃지 미표시
  if (isAdminAccount) {
    return null
  }

  const clicks = Number(member?.clicks || 0)

  // 1. 250회 달성 (명예의 전당)
  if (clicks >= 250) {
    return {
      tier: 'crown',
      label: '250 달성',
      icon: Crown,
      color: 'text-amber-400',
      fill: 'fill-amber-400',
      border: 'border-amber-400/50',
      bg: 'bg-amber-400/15 backdrop-blur-md',
      tooltip: '250회 달성 (명예의 전당) 👑',
    }
  }

  // 2. 200회 달성 (마스터)
  if (clicks >= 200) {
    return {
      tier: 'zap',
      label: '200 달성',
      icon: Zap,
      color: 'text-violet-400',
      fill: 'fill-violet-400',
      border: 'border-violet-400/50',
      bg: 'bg-violet-400/15 backdrop-blur-md',
      tooltip: '200회 달성 (마스터) ⚡',
    }
  }

  // 3. 100회 달성 (열정 러너)
  if (clicks >= 100) {
    return {
      tier: 'flame',
      label: '100 달성',
      icon: Flame,
      color: 'text-rose-400',
      fill: 'fill-rose-400',
      border: 'border-rose-400/50',
      bg: 'bg-rose-400/15 backdrop-blur-md',
      tooltip: '100회 달성 (열정 러너) 🔥',
    }
  }

  // 4. 50회 달성 (챌린저)
  if (clicks >= 50) {
    return {
      tier: 'sparkles',
      label: '50 달성',
      icon: Sparkles,
      color: 'text-cyan-400',
      fill: 'fill-cyan-400',
      border: 'border-cyan-400/50',
      bg: 'bg-cyan-400/15 backdrop-blur-md',
      tooltip: '50회 달성 (챌린저) ✨',
    }
  }

  // 5. 새싹 (0~49회 - 성장의 첫 걸음)
  return {
    tier: 'sprout',
    label: '새싹',
    icon: Sprout,
    color: 'text-emerald-400',
    fill: 'fill-emerald-400',
    border: 'border-emerald-400/50',
    bg: 'bg-emerald-400/15 backdrop-blur-md',
    tooltip: 'LIT 챌린지 새싹 (0~49회) 🌱',
  }
}

/**
 * MemberAvatarBadge
 * Toss / Linear 스타일의 모던 벡터 뱃지 컴포넌트
 * @param {Object} member - 회원 데이터 ({ clicks, role, handle, ... })
 * @param {'sm' | 'md' | 'lg'} size - 뱃지 크기 (sm: 20px, md: 24px, lg: 28px)
 * @param {string} className - 추가 클래스
 */
export default function MemberAvatarBadge({ member, size = 'md', className = '' }) {
  const tier = getMemberTierInfo(member)
  if (!tier || !tier.icon) return null

  const Icon = tier.icon

  const sizeStyles = {
    sm: {
      container: 'h-5 w-5 -bottom-1.5 -right-1.5 p-0.5',
      icon: 'h-3.5 w-3.5',
    },
    md: {
      container: 'h-6 w-6 -bottom-1.5 -right-1.5 p-1',
      icon: 'h-4 w-4',
    },
    lg: {
      container: 'h-7 w-7 -bottom-2 -right-2 p-1',
      icon: 'h-4.5 w-4.5',
    },
  }[size] || {
    container: 'h-5 w-5 -bottom-1.5 -right-1.5 p-0.5',
    icon: 'h-3.5 w-3.5',
  }

  return (
    <span
      className={`absolute inline-flex items-center justify-center rounded-full border border-line bg-white dark:bg-surface transition-all duration-200 hover:scale-110 cursor-help shrink-0 ${sizeStyles.container} ${className}`}
      title={tier.tooltip}
      aria-label={tier.tooltip}
    >
      <Icon className={`${sizeStyles.icon} ${tier.color} ${tier.fill} stroke-[2.2]`} />
    </span>
  )
}

/**
 * MemberTierChip
 * 이름 옆이나 뱃지 영역에 텍스트와 함께 깔끔하게 정렬되는 뱃지 칩
 */
export function MemberTierChip({ member, showLabel = true, className = '' }) {
  const tier = getMemberTierInfo(member)
  if (!tier || !tier.icon) return null

  const Icon = tier.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-white dark:bg-surface px-2.5 py-1 text-xs font-semibold tracking-tight transition-transform hover:scale-105 select-none ${tier.color} ${className}`}
      title={tier.tooltip}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tier.fill} stroke-[2.2]`} />
      {showLabel && <span>{tier.label}</span>}
    </span>
  )
}

/**
 * MemberNameBadge
 * 프로필 모달 등에서 아이디 오른쪽에 배치되는 전용 아이콘 뱃지
 */
export function MemberNameBadge({ member, size = 'md', className = '' }) {
  const tier = getMemberTierInfo(member)
  if (!tier || !tier.icon) return null

  const Icon = tier.icon

  const sizeClasses = {
    sm: 'h-6 w-6 p-1',
    md: 'h-7 w-7 sm:h-8 sm:w-8 p-1.5',
    lg: 'h-8 w-8 sm:h-9 sm:w-9 p-1.5',
  }[size] || 'h-7 w-7 sm:h-8 sm:w-8 p-1.5'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-line bg-white dark:bg-surface transition-all duration-200 hover:scale-110 cursor-help shrink-0 ${sizeClasses} ${className}`}
      title={tier.tooltip}
      aria-label={tier.tooltip}
    >
      <Icon className={`h-full w-full ${tier.color} ${tier.fill} stroke-[2.2]`} />
    </span>
  )
}

