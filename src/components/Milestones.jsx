import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Check, Users } from 'lucide-react'
import { storageService } from '../services/storageService.js'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import MilestonesModal from './MilestonesModal.jsx'

export default function Milestones({ onOpenAuth }) {
  const [milestones, setMilestones] = useState(() => storageService.getMilestones())
  const [members, setMembers] = useState(storageService.getMembers())
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false)

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setMilestones(storageService.getMilestones())
      setMembers(storageService.getMembers())
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [])

  const myClicks = currentUser?.clicks || 0

  return (
    <section id="milestones" className="relative scroll-mt-24 px-4 sm:px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title="단계별"
            accent="보상"
            desc="조회수 목표를 달성할 때마다 보상을 드립니다."
          />

          {isAdmin && (
            <Reveal delay={0.1}>
              <button
                type="button"
                onClick={() => setIsMilestonesModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/80 hover:bg-surface px-3.5 py-2 text-xs font-semibold text-fg hover:border-line/80 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Award className="h-3.5 w-3.5 text-[#3182F6]" />
                <span>보상 기준 관리</span>
              </button>
            </Reveal>
          )}
        </div>

        {/* 4단계 깔끔한 미니멀 보상 카드 그리드 */}
        <Reveal delay={0.05} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map((ml) => {
            const achievers = members.filter((m) => (m.clicks || 0) >= ml.count)
            const achieversCount = achievers.length
            const isAchieved = currentUser && myClicks >= ml.count
            const pct = currentUser ? Math.min(100, Math.round(((myClicks || 0) / ml.count) * 100)) : 0

            return (
              <div
                key={ml.count}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
                }}
                className={`spotlight-card relative flex flex-col justify-between rounded-2xl border p-5 transition-colors duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isAchieved
                    ? 'border-mint/50 bg-mint/[0.03]'
                    : 'border-line bg-surface/70 hover:border-[#3182F6]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{ml.icon}</span>
                  </div>

                  <div className="mt-3.5">
                    <span className="text-xs font-bold text-[#3182F6]">
                      {ml.count}회 달성
                    </span>
                    <h4 className="mt-1 text-base font-bold text-fg leading-snug">
                      {ml.reward}
                    </h4>
                    {ml.desc && (
                      <p className="mt-1.5 text-xs text-muted leading-relaxed">
                        {ml.desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* 프로그레스 바 ('바') & 달성 인원 */}
                <div className="mt-6 pt-3.5 border-t border-line/60">
                  <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                    <span className={isAchieved ? 'text-mint font-bold flex items-center gap-1' : 'text-muted'}>
                      {isAchieved ? (
                        <>
                          <Check className="h-3 w-3" /> 달성 완료
                        </>
                      ) : currentUser ? (
                        `${myClicks} / ${ml.count}회 (${pct}%)`
                      ) : (
                        `목표: ${ml.count}회`
                      )}
                    </span>
                    <span className="text-muted/70 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {achieversCount}명 달성
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${isAchieved ? 100 : pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-mint' : 'bg-[#3182F6]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>

      <MilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => {
          setIsMilestonesModalOpen(false)
          setMilestones(storageService.getMilestones())
        }}
      />
    </section>
  )
}

