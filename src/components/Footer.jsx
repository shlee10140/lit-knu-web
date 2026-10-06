import { ArrowUpRight, Github, Instagram, MessageCircle, NotebookText } from 'lucide-react'
import Logo from './ui/Logo.jsx'
import { links, nav } from '../data/site.js'

const socials = [
  { label: 'Instagram', href: links.instagram, icon: Instagram, handle: '@lit_knu' },
  { label: 'GitHub', href: links.github, icon: Github, handle: 'LITofficial' },
  { label: 'Notion', href: links.notion, icon: NotebookText, handle: '운영 가이드' },
  { label: 'KakaoTalk', href: links.kakao, icon: MessageCircle, handle: '오픈채팅' },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-20">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-[2fr_1fr_1.2fr]">
          <div className="max-w-md">
            <Logo className="text-5xl sm:text-6xl" />
            <div className="mt-4 text-sm leading-relaxed text-muted break-keep">
              <p className="font-medium text-fg/90">Learn It, Teach.</p>
              <p className="mt-1">
                경북대학교 IT 기술 발표 동아리 LIT의 MSA 챌린지 플랫폼.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted/80">Menu</p>
            <ul className="mt-5 space-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-sm text-fg/80 transition-colors hover:text-fg">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted/80">Connect</p>
            <ul className="mt-5 space-y-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between text-sm text-fg/80 transition-colors hover:text-fg"
                  >
                    <span className="flex items-center gap-2.5">
                      <s.icon className="h-4 w-4 text-muted transition-colors group-hover:text-mint" />
                      {s.label}
                      <span className="text-muted">{s.handle}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={links.msaOfficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  Microsoft Student Ambassadors Portal ↗
                </a>
              </li>
              <li>
                <a
                  href={links.mslearn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  Microsoft Learn ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-row items-center justify-between gap-2 border-t border-line pt-6 text-xs text-muted/60">
          <span className="truncate sm:overflow-visible">© {new Date().getFullYear()} LIT · Learn It, Teach</span>
          <span className="shrink-0 font-medium">LIT</span>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none text-center font-display text-[30vw] font-extrabold leading-[0.75] tracking-[-0.06em] text-outline mask-fade-b"
      >
        LIT
      </div>
    </footer>
  )
}
