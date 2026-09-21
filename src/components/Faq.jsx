import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, Edit3, ShieldCheck, X, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import { storageService } from '../services/storageService.js'

function Item({ item, i, open, onToggle, isAdmin, onEdit, onDelete }) {
  return (
    <Reveal delay={i * 0.05}>
      <div className={`group border-b border-line transition-colors ${open ? 'bg-white/[0.02]' : ''}`}>
        <div className="flex w-full items-start justify-between gap-4 py-6">
          <button
            onClick={onToggle}
            data-cursor="hover"
            aria-expanded={open}
            className="flex flex-1 items-start text-left gap-4 sm:gap-5"
          >
            <span className="mt-1 font-mono text-xs tracking-widest text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-display text-lg font-semibold tracking-tight sm:text-2xl text-fg group-hover:text-mint transition-colors">
              {item.q}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {isAdmin && (
              <div className="flex items-center gap-1.5 mr-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(item)
                  }}
                  title="FAQ 수정"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface/60 text-muted hover:text-mint hover:border-mint/50 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item)
                  }}
                  title="FAQ 삭제"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface/60 text-muted hover:text-pink hover:border-pink/50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={onToggle}
              aria-label={open ? '답변 닫기' : '답변 열기'}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                open ? 'border-mint/50 text-mint bg-mint/10' : 'border-line text-muted hover:border-white/30'
              }`}
            >
              <motion.span
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="a"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="pb-7 pl-[calc(1rem+1.5ch)] pr-12 text-[15px] leading-relaxed text-muted whitespace-pre-line">
                {item.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

export default function Faq() {
  const [faqs, setFaqs] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(0)

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [formData, setFormData] = useState({ q: '', a: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFaqs(storageService.getFaqs())
    setIsAdmin(storageService.isAdmin())

    const unsub = storageService.subscribe(() => {
      setFaqs(storageService.getFaqs())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [])

  // 모달 열기 (추가 모드)
  const handleOpenAddModal = () => {
    setEditingFaq(null)
    setFormData({ q: '', a: '' })
    setIsModalOpen(true)
  }

  // 모달 열기 (수정 모드)
  const handleOpenEditModal = (item) => {
    setEditingFaq(item)
    setFormData({ q: item.q, a: item.a })
    setIsModalOpen(true)
  }

  // 삭제 처리
  const handleDeleteFaq = async (item) => {
    if (confirm(`"${item.q}" 질문을 삭제하시겠습니까?`)) {
      await storageService.deleteFaq(item.id)
    }
  }

  // 저장 처리 (추가 또는 수정)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.q.trim() || !formData.a.trim()) {
      alert('질문과 답변을 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingFaq) {
        await storageService.updateFaq(editingFaq.id, {
          q: formData.q,
          a: formData.a,
        })
      } else {
        await storageService.addFaq({
          q: formData.q,
          a: formData.a,
        })
      }

      setIsModalOpen(false)
      setEditingFaq(null)
      setFormData({ q: '', a: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="faq" className="relative scroll-mt-24 px-4 sm:px-6 py-28 sm:py-36 overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <SectionHeading
            title="자주 묻는"
            accent="질문"
            desc="LIT 챌린지와 활동에 관해 자주 묻는 질문들을 모았습니다."
          />

          {isAdmin && (
            <div className="mt-8 flex flex-col gap-3.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink/40 bg-pink/10 px-3 py-1 text-xs text-pink w-fit">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-semibold">운영진 관리자 모드 활성화</span>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs font-bold text-bg transition-all hover:bg-mint/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-mint/10 w-fit"
              >
                <Plus className="h-4 w-4" />
                <span>+ 새 FAQ 질문 등록</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-line">
          {faqs.length === 0 ? (
            <div className="py-16 text-center text-muted">
              <HelpCircle className="mx-auto h-8 w-8 text-muted/50 mb-3" />
              <p className="text-sm">등록된 자주 묻는 질문이 없습니다.</p>
              {isAdmin && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-3 text-xs text-mint underline underline-offset-4 hover:opacity-80"
                >
                  첫 번째 질문 등록하기
                </button>
              )}
            </div>
          ) : (
            faqs.map((f, i) => (
              <Item
                key={f.id || f.q}
                item={f}
                i={i}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
                isAdmin={isAdmin}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteFaq}
              />
            ))
          )}
        </div>
      </div>

      {/* FAQ 추가/수정 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="modal-panel relative w-full max-w-lg rounded-2xl border border-line bg-card/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-mint/40 bg-mint/10 text-mint">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-fg">
                      {editingFaq ? 'FAQ 질문 수정' : '새 FAQ 질문 등록'}
                    </h3>
                    <p className="text-[11px] text-muted">
                      {editingFaq ? '기존 질문과 답변 내용을 수정합니다.' : '부원들이 자주 묻는 질문을 추가합니다.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    질문 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.q}
                    onChange={(e) => setFormData({ ...formData, q: e.target.value })}
                    placeholder="예: 250 클릭 달성 후 혜택은 무엇인가요?"
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg placeholder:text-muted/60 focus:border-mint/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    답변 내용 *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.a}
                    onChange={(e) => setFormData({ ...formData, a: e.target.value })}
                    placeholder="상세한 답변 내용을 입력해 주세요. 줄바꿈도 그대로 보존됩니다."
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg placeholder:text-muted/60 focus:border-mint/50 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="glass rounded-xl px-4 py-2.5 text-xs text-muted hover:text-fg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-mint px-5 py-2.5 text-xs font-bold text-bg hover:bg-mint/90 transition-colors shadow-md shadow-mint/10 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? '저장 중...' : (editingFaq ? '수정 완료' : '등록하기')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}

