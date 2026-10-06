import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { storageService, compressImage } from '../services/storageService.js'

export default function VerifyClicksModal({ isOpen, onClose, member, onSuccess }) {
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const fileInputRef = useRef(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImageFile(null)
      setPreviewUrl(null)
      setIsAnalyzing(false)
      setAnalysisResult(null)
      setErrorMsg(null)
    }
  }, [isOpen])

  // Support clipboard paste (Cmd+V / Ctrl+V)
  useEffect(() => {
    if (!isOpen) return

    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            handleFileSelect(file)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen])

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일(PNG, JPG, WebP)만 업로드할 수 있습니다.')
      return
    }

    // Limit size to 30MB (최신 스마트폰 고화질 카메라 사진 및 스크린샷 표준 규격 대응)
    if (file.size > 30 * 1024 * 1024) {
      setErrorMsg('이미지 용량은 30MB 이하로 올려주세요.')
      return
    }

    setErrorMsg(null)
    setAnalysisResult(null)
    setImageFile(file)

    try {
      // Compress to max 1600px width/height and 0.88 quality
      // Keeps text crisp for AI reading while staying well under Cosmos DB document limits (~200-400KB)
      const compressedDataUrl = await compressImage(file, 1600, 0.88)
      setPreviewUrl(compressedDataUrl || '')
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleStartVerification = async () => {
    if (!previewUrl || !member) return
    setIsAnalyzing(true)
    setErrorMsg(null)
    setAnalysisResult(null)

    try {
      const res = await storageService.verifyMemberClicks(
        member.handle,
        previewUrl,
        imageFile?.type || 'image/png'
      )

      setAnalysisResult(res)
      if (onSuccess) {
        onSuccess(res)
      }
    } catch (err) {
      setErrorMsg(err.message || '메일 확인 중 오류가 발생했습니다. 선명한 캡처로 다시 시도해 주세요.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen || !member) return null

  const currentClicks = member.clicks || 0

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-bg/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg rounded-3xl border border-line bg-surface/95 p-5 sm:p-6 shadow-2xl my-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <div>
            <h3 className="font-sans text-lg font-bold text-fg">
              클릭수 수정
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Total Preferred Visitors(방문자 수)가 보이는 메일 캡처를 올려주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:text-fg hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-4">
          {/* Upload Dropzone (When not yet analyzed successfully) */}
          {!analysisResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 transition-all ${
                isDragging
                  ? 'border-mint bg-mint/10 scale-[1.01]'
                  : previewUrl
                  ? 'border-line/70 bg-black/40'
                  : 'border-line/80 bg-white/[0.01] hover:border-pink/50 hover:bg-white/[0.03] cursor-pointer'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative max-h-60 max-w-full overflow-hidden rounded-xl border border-line shadow-lg">
                    <img
                      src={previewUrl}
                      alt="메일 캡처 미리보기"
                      className="max-h-60 object-contain"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-fg hover:border-white/30"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>다른 사진으로 변경</span>
                    </button>
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFile(null)
                        setPreviewUrl(null)
                      }}
                      className="text-xs text-muted hover:text-pink transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2 py-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] border border-line text-muted">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-fg">
                      메일 캡처 이미지 업로드
                    </p>
                    <p className="text-xs text-muted mt-1">
                      파일을 끌어다 놓거나 클릭 / 바로 붙여넣기 (Cmd + V)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">확인 불가</p>
                  <p className="mt-0.5 text-red-300/90 leading-relaxed">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success State Card */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-mint/40 bg-mint/[0.06] p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-mint" />
                  <span className="font-sans text-sm sm:text-base font-bold text-mint">
                    클릭수가 갱신되었습니다
                  </span>
                </div>

                {/* Before & After Clicks Display */}
                <div className="flex items-center justify-around rounded-xl bg-black/40 border border-line p-3 text-center">
                  <div>
                    <span className="block text-[11px] font-medium text-muted">기존</span>
                    <span className="font-sans text-xl font-bold text-muted line-through">
                      {currentClicks}회
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-mint" />
                  <div>
                    <span className="block text-[11px] font-bold text-mint">
                      변경
                    </span>
                    <span className="font-sans text-2xl font-black text-mint">
                      {analysisResult.verifiedClicks}회
                    </span>
                  </div>
                  <div className="rounded-xl bg-mint/20 border border-mint/30 px-3 py-1">
                    <span className="block text-[10px] font-semibold text-mint">변동</span>
                    <span className="text-sm font-bold text-mint">
                      {analysisResult.verifiedClicks >= currentClicks ? '+' : ''}
                      {analysisResult.verifiedClicks - currentClicks}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            {!analysisResult && (
              <button
                type="button"
                onClick={onClose}
                className="glass rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-fg hover:border-white/30"
              >
                취소
              </button>
            )}

            {!analysisResult ? (
              <button
                type="button"
                disabled={!previewUrl || isAnalyzing}
                onClick={handleStartVerification}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink to-mint px-5 py-2 font-sans text-xs sm:text-sm font-bold text-bg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-bg" />
                    <span>확인 중...</span>
                  </>
                ) : (
                  <span>확인</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-mint px-6 py-2 font-sans text-xs sm:text-sm font-bold text-bg transition-transform hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                <span>완료</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
