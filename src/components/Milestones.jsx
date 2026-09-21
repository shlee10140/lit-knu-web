import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Gift, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react'
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
    <section id="milestones" className="relative scroll-mt-24 px-4 sm:px-6 py-20 sm:py-28 overflow-hidden">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/3 top-1/2 -z-10 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-mint/10 blur-[140px]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title="단계별"
            accent="보상"
            desc="조회수 마일스톤을 달성할 때마다 특별한 보상과 공식 인증 뱃지를 지급합니다."
          />

          {/* Admin Edit Milestones Button */}
          {isAdmin && (
            <Reveal delay={0.1}>
              <button
                type="button"
                onClick={() => setIsMilestonesModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-fg transition-all hover:bg-white/20 hover:border-white/40 shadow-sm"
              >
                <Award className="h-4 w-4 text-mint" />
                <span>보상 & 조회수 기준 관리</span>
              </button>
            </Reveal>
          )}
        </div>

        {/* Milestone Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map((ml, idx) => {
            const achievers = members.filter((m) => (m.clicks || 0) >= ml.count)
            const achieversCount = achievers.length
            const isAchievedByMe = currentUser && myClicks >= ml.count

            return (
              <motion.div
                key={ml.count}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01] ${
                  isAchievedByMe
                    ? 'border-mint/40 bg-surface/80 shadow-[0_0_20px_rgba(94,240,214,0.1)]'
                    : 'border-line bg-surface/50 hover:border-white/30 hover:bg-surface/80'
                }`}
              >

                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl shadow-inner transition-transform group-hover:scale-110">
                    {ml.icon}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-black tracking-wide text-mint">
                      {ml.count} 조회수
                    </span>

                    <h4 className="mt-1.5 font-display text-base sm:text-lg font-bold leading-snug tracking-tight text-fg group-hover:text-white">
                      {ml.reward}
                    </h4>

                    {/* 우측 하단 n명 달성 카운트 */}
                    <div className="mt-3 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] border border-line/40 px-2 py-0.5 font-mono text-[11px] text-muted">
                        <Users className="h-3 w-3" />
                        {achieversCount}명 달성
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Admin Milestones Modal */}
      <MilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => setIsMilestonesModalOpen(false)}
      />
    </section>
  )
}

