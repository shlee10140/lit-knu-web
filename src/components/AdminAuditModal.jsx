import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, RefreshCw, Eye, Calendar, ArrowRight, ExternalLink, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { storageService } from '../services/storageService.js'
import { useScrollLock } from './ui/Modal.jsx'

export default function AdminAuditModal({ isOpen, onClose }) {
  useScrollLock(isOpen)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('ALL') // 'ALL', 'APPROVED', 'REJECTED'

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await storageService.getVerificationAuditLogs()
      setLogs(data || [])
    } catch (e) {
      console.warn('Failed to load audit logs:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
      setSelectedImage(null)
      setFilter('ALL')
    }
  }, [isOpen])

  if (!isOpen) return null

  const approvedCount = logs.filter((l) => l.status === 'APPROVED').length
  const rejectedCount = logs.filter((l) => l.status === 'REJECTED' || l.status === 'ERROR').length

  const filteredLogs = logs.filter((l) => {
    if (filter === 'APPROVED') return l.status === 'APPROVED'
    if (filter === 'REJECTED') return l.status === 'REJECTED' || l.status === 'ERROR'
    return true
  })

  return createPortal(
    <div
      data-modal-root
      data-lenis-prevent
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-bg/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        data-lenis-prevent
        className="relative w-full max-w-3xl rounded-3xl border border-line bg-surface/95 p-5 sm:p-7 shadow-[0_8px_32px_rgba(49,130,246,0.12)] my-auto max-h-[85vh] h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3182F6]/15 border border-[#3182F6]/30 text-[#3182F6] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-lg sm:text-xl font-bold text-fg tracking-tight">
                  부원 클릭수 인증 로그
                </h3>
                <span className="rounded-full bg-[#3182F6]/10 border border-[#3182F6]/30 px-2 py-0.5 text-[10px] font-bold text-[#3182F6]">
                  관리자 전용
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                부원들이 제출한 메일 캡처와 클릭수 검증(성공 및 실패) 내역입니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              title="새로고침"
              className="glass rounded-full p-2 text-muted hover:text-fg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted hover:text-fg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-3.5 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-fg text-bg'
                : 'glass text-muted hover:text-fg'
            }`}
          >
            전체 ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('APPROVED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'APPROVED'
                ? 'bg-mint text-bg font-bold'
                : 'glass text-muted hover:text-mint'
            }`}
          >
            인증 성공 ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('REJECTED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'REJECTED'
                ? 'bg-rose-500 text-white font-bold'
                : 'glass text-muted hover:text-rose-400'
            }`}
          >
            인증 실패 ({rejectedCount})
          </button>
        </div>

        {/* Audit Log Content List */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto mt-3 pr-2 space-y-3 overscroll-contain"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#3182F6]" />
              <p className="text-xs">인증 로그를 불러오는 중...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted text-center space-y-2 rounded-2xl border border-dashed border-line">
              <AlertCircle className="h-8 w-8 text-muted/60" />
              <p className="font-sans text-sm font-semibold text-fg">해당 조건의 인증 내역이 없습니다.</p>
              <p className="text-xs text-muted">
                부원이 프로필에서 메일 스크린샷을 인증하면 실시간으로 이곳에 기록됩니다.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isRejected = log.status === 'REJECTED' || log.status === 'ERROR'
              const delta = (log.verifiedClicks || 0) - (log.previousClicks || 0)

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-4 transition-colors space-y-2.5 ${
                    isRejected
                      ? 'border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/50'
                      : 'border-line/80 bg-white/[0.02] hover:border-[#3182F6]/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-bold text-fg">
                        {log.memberName || log.handle}
                      </span>
                      <span className="text-xs text-muted">@{log.handle}</span>

                      {isRejected ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                          <XCircle className="h-3 w-3" />
                          인증 실패
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-mint/30 bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
                          <CheckCircle2 className="h-3 w-3" />
                          인증 성공
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'}</span>
                    </div>
                  </div>

                  {/* Body: Approved stats or Rejection reason */}
                  {isRejected ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 px-3.5 py-2.5">
                      <div className="text-xs text-rose-300 min-w-0">
                        <span className="font-bold text-rose-400 mr-1.5">실패 사유:</span>
                        <span>{log.summaryKorean || '유효한 메일 화면 또는 클릭수 미확인'}</span>
                      </div>

                      {log.evidenceImage && (
                        <button
                          type="button"
                          onClick={() => setSelectedImage(log.evidenceImage)}
                          className="glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#3182F6] hover:border-[#3182F6]/40 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>제출 캡처 보기</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl bg-black/40 border border-line/70 px-3.5 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted">이전: {log.previousClicks || 0}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-mint" />
                        <span className="font-bold text-mint">인증 후: {log.verifiedClicks}</span>
                        <span className="rounded bg-mint/20 px-1.5 py-0.5 text-[10px] font-bold text-mint">
                          {delta >= 0 ? `+${delta}` : delta}
                        </span>
                      </div>

                      {log.evidenceImage && (
                        <button
                          type="button"
                          onClick={() => setSelectedImage(log.evidenceImage)}
                          className="glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#3182F6] hover:border-[#3182F6]/40 cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>원본 캡처 보기</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-line flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="glass rounded-xl px-5 py-2 text-xs font-semibold text-fg hover:border-white/30"
          >
            닫기
          </button>
        </div>

        {/* Screenshot Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
              <div
                className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center px-3 py-2 border-b border-line">
                  <span className="font-sans text-sm font-semibold text-fg">제출된 원본 메일 캡처</span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1 text-muted hover:text-fg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="overflow-auto max-h-[80vh] p-2">
                  <img
                    src={selectedImage}
                    alt="인증 메일 원본"
                    className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body,
  )
}
