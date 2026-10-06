import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Plus,
  Trash2,
  X,
  Check,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import Modal from './ui/Modal.jsx'
import { storageService, DEFAULT_MILESTONES } from '../services/storageService.js'

export default function MilestonesModal({ isOpen, onClose }) {
  const [items, setItems] = useState(() => storageService.getMilestones())
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 모달이 열릴 때마다 최신 데이터로 동기화
  useEffect(() => {
    if (isOpen) {
      setItems(storageService.getMilestones())
      setSavedSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleAddItem = () => {
    const lastCount = items.length > 0 ? Number(items[items.length - 1].count) || 0 : 0
    const newCount = lastCount + 50
    setItems([
      ...items,
      {
        count: newCount,
        icon: '🎁',
        reward: '새 보상 내용',
        desc: '새로운 마일스톤 달성을 축하합니다!',
        title: `${newCount} 달성`,
        badge: `${newCount} 달성`,
        color: 'mint',
      },
    ])
  }

  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      alert('최소 1개 이상의 마일스톤 단계가 필요합니다.')
      return
    }
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const updated = [...items]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setItems(updated)
  }

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return
    const updated = [...items]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setItems(updated)
  }

  const handleSortAsc = () => {
    const sorted = [...items].sort((a, b) => (Number(a.count) || 0) - (Number(b.count) || 0))
    setItems(sorted)
  }

  const handleResetDefault = () => {
    if (confirm('기본 공식 4단계 마일스톤(50, 100, 200, 250) 설정으로 복원하시겠습니까?')) {
      setItems([...DEFAULT_MILESTONES])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const sanitized = items
        .map((it) => {
          const count = Math.max(0, Number(it.count) || 0)
          return {
            ...it,
            count,
            icon: String(it.icon || '🍩').trim(),
            reward: String(it.reward || '').trim(),
            desc: String(it.desc || '').trim(),
            title: `${count} 달성`,
            badge: `${count} 달성`,
          }
        })
        .sort((a, b) => a.count - b.count)

      await storageService.updateMilestones(sanitized)
      setSavedSuccess(true)
      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 700)
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        data-lenis-prevent
        className="modal-panel relative flex flex-col w-full max-w-xl max-h-[85vh] sm:max-h-[88vh] rounded-3xl border border-line bg-surface shadow-2xl overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-line p-5 sm:p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3182F6]/10 border border-[#3182F6]/30">
              <Award className="h-5 w-5 text-[#3182F6]" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-fg">
                보상 및 마일스톤 설정 (DB 실시간 연동)
              </h3>
              <p className="text-xs text-muted">
                조회수 달성 기준, 보상 내용, 상세 설명 문구, 아이콘을 원하는 대로 수정할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with Scrollable Content and Fixed Footer */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Milestone Items List */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain"
          >
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-line bg-white/[0.03] p-3 sm:p-3.5 space-y-2.5 transition-colors hover:border-white/20"
                >
                  {/* Top Row: Icon, Count, Reward Name, Actions */}
                  <div className="flex items-center gap-2">
                    {/* Emoji / Icon Input */}
                    <div className="w-14 shrink-0">
                      <label className="block text-[10px] font-semibold text-muted mb-1 text-center">
                        아이콘
                      </label>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => handleItemChange(idx, 'icon', e.target.value)}
                        className="glass w-full rounded-xl py-1.5 text-center text-lg focus:border-[#3182F6] focus:outline-none"
                        maxLength={4}
                        required
                      />
                    </div>

                    {/* Count Threshold Input */}
                    <div className="w-24 sm:w-28 shrink-0">
                      <label className="block text-[10px] font-semibold text-muted mb-1">
                        조회수 기준
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={item.count}
                          onChange={(e) => handleItemChange(idx, 'count', e.target.value)}
                          className="glass w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#3182F6] focus:border-[#3182F6] focus:outline-none"
                          required
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                          회
                        </span>
                      </div>
                    </div>

                    {/* Reward Name Input */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-muted mb-1">
                        보상 명칭
                      </label>
                      <input
                        type="text"
                        value={item.reward}
                        onChange={(e) => handleItemChange(idx, 'reward', e.target.value)}
                        placeholder="예: 던킨 미니 도넛 세트"
                        className="glass w-full rounded-xl px-3 py-1.5 text-xs text-fg focus:border-[#3182F6] focus:outline-none"
                        required
                      />
                    </div>

                    {/* Order & Delete Actions */}
                    <div className="shrink-0 flex items-center gap-0.5 pt-4">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        title="위로 이동"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-white/10 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        title="아래로 이동"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-white/10 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        title="이 단계 삭제"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-pink hover:bg-pink/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Detailed Description Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-muted mb-1">
                      상세 설명 문구
                    </label>
                    <input
                      type="text"
                      value={item.desc || ''}
                      onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                      placeholder="예: 달콤한 에너지 충전! 첫 마일스톤 달성"
                      className="glass w-full rounded-xl px-3 py-1.5 text-xs text-fg placeholder:text-muted/50 focus:border-[#3182F6] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions: Add Item & Sort & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#3182F6]/40 bg-[#3182F6]/5 px-3 py-2 text-xs font-semibold text-[#3182F6] hover:bg-[#3182F6]/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                새 마일스톤 단계 추가
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSortAsc}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg transition-colors cursor-pointer"
                  title="조회수 기준 오름차순으로 정렬"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  기준순 정렬
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  기본값 복원
                </button>
              </div>
            </div>

            {savedSuccess && (
              <p className="text-xs text-mint flex items-center gap-1 font-semibold justify-center pt-2">
                <Check className="h-4 w-4" />
                Azure Cosmos DB에 성공적으로 동기화되었습니다!
              </p>
            )}
          </div>

          {/* Fixed Footer: Always visible submit button */}
          <div className="shrink-0 p-5 sm:p-6 pt-3 border-t border-line bg-surface/95 backdrop-blur">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-[#3182F6] hover:bg-[#2563EB] py-3 text-xs font-bold text-white transition-colors shadow-sm shadow-[#3182f6]/25 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Azure DB 저장 중...' : '마일스톤 설정 저장 및 즉시 반영'}
            </button>
          </div>
        </form>
      </motion.div>
    </Modal>
  )
}
