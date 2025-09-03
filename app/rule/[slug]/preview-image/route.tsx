import { ImageResponse } from 'next/og'
import { db } from "@/lib/db"
import { cursorRule, user } from "@/lib/schema"
import { eq, and, like } from "drizzle-orm"
import { loadGeistFonts } from '@/lib/loadFont'

const size = {
  width: 1200,
  height: 900, // 4:3 aspect ratio
}

function parseSlug(slug: string): { title: string; last3: string } | null {
  const lastDashIndex = slug.lastIndexOf('-')
  if (lastDashIndex === -1 || lastDashIndex === slug.length - 1) {
    return null
  }
  const last3 = slug.substring(lastDashIndex + 1)
  const title = slug.substring(0, lastDashIndex)
  if (last3.length !== 3) {
    return null
  }
  return { title, last3 }
}

function createSlug(title: string, ruleId: string): string {
  const urlTitle = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const last3 = ruleId.slice(-3)
  return `${urlTitle}-${last3}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const parsed = parseSlug(resolvedParams.slug)
    if (!parsed) {
      throw new Error("Invalid slug format")
    }
    const { last3 } = parsed

    const rules = await db
      .select({
        id: cursorRule.id,
        title: cursorRule.title,
        content: cursorRule.content,
        ruleType: cursorRule.ruleType,
        views: cursorRule.views,
        createdAt: cursorRule.createdAt,
        updatedAt: cursorRule.updatedAt,
        user: {
          name: user.name,
          email: user.email,
        },
      })
      .from(cursorRule)
      .leftJoin(user, eq(cursorRule.userId, user.id))
      .where(
        and(
          eq(cursorRule.isPublic, true),
          like(cursorRule.id, `%${last3}`)
        )
      )

    const matchingRule = rules.find((rule) => {
      const ruleSlug = createSlug(rule.title, rule.id)
      return ruleSlug === resolvedParams.slug && rule.id.endsWith(last3)
    })

    if (!matchingRule) {
      throw new Error("Rule not found")
    }

    const contentLines = matchingRule.content.split('\n')
    const firstFiveLines = contentLines.slice(0, 5).join('\n')
    const truncatedContent = firstFiveLines.length > 300
      ? firstFiveLines.substring(0, 300) + '...'
      : firstFiveLines

    const text = `${matchingRule.title} by ${matchingRule.user?.name || 'Anonymous'} ${truncatedContent} cursor.link`
    const { geistMedium, geistSemiBold } = await loadGeistFonts(text)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#16171A',
            color: 'white',
            fontFamily: 'Geist',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '56px',
                fontWeight: 600,
                lineHeight: 1.2,
                color: 'white',
                marginBottom: '12px',
              }}
            >
              {matchingRule.title}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                color: '#9CA3AF',
                marginBottom: '20px',
                fontWeight: 500,
              }}
            >
              by {matchingRule.user?.name || 'Anonymous'}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: '20px',
                lineHeight: 1.6,
                color: '#D1D5DB',
                backgroundColor: '#1B1D21',
                padding: '32px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: 'Geist',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
              }}
            >
              {truncatedContent}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '32px 60px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.5 17H11.5C10.1216 17 9 15.8784 9 14.5C9 13.1729 10.0396 12.084 11.3472 12.0044C11.917 10.7993 13.1382 10 14.5 10C16.4297 10 18 11.5703 18 13.5C18 15.4297 16.4297 17 14.5 17Z"
                  fill="#70A7D7"
                />
                <path
                  d="M8.18122 16.7317C7.75118 16.0939 7.5 15.3259 7.5 14.5C7.5 13.8608 7.6503 13.2566 7.91742 12.7206C6.28016 12.6308 4.76647 12.3385 3.55984 11.8809C3.12912 11.7175 2.70837 11.5221 2.32335 11.2883C2.18463 11.204 2 11.3008 2 11.4631V13.75C2 14.3646 2.34809 14.8507 2.75498 15.1971C3.16484 15.546 3.71371 15.8262 4.32648 16.0468C5.36798 16.4217 6.71004 16.6653 8.18122 16.7317Z"
                  fill="#70A7D7"
                  fill-opacity="0.4"
                />
                <path
                  d="M2 4.25C2 3.83579 2.33579 3.5 2.75 3.5H15.25C15.6642 3.5 16 3.83579 16 4.25V8.5C16 8.57586 15.9928 8.65022 15.9791 8.72304C15.5115 8.57808 15.0147 8.5 14.5 8.5C12.8289 8.5 11.3134 9.33715 10.4013 10.6533C9.95435 10.7811 9.53926 10.9847 9.17085 11.2492C9.11406 11.2497 9.05711 11.25 9 11.25C7.08613 11.25 5.35093 10.9559 4.09183 10.4784C3.4632 10.2399 2.94759 9.95364 2.5867 9.62993C2.22718 9.30746 2 8.92749 2 8.5V4.25Z"
                  fill="#70A7D7"
                  fill-opacity="0.4"
                />
                <path
                  d="M4.32656 1.9532C5.55849 1.50975 7.21089 1.25 9 1.25C10.7891 1.25 12.4415 1.50975 13.6734 1.9532C14.2862 2.17378 14.8351 2.45405 15.245 2.80293C15.6519 3.14928 16 3.6354 16 4.25C16 4.8646 15.6519 5.35072 15.245 5.69707C14.8351 6.04595 14.2862 6.32622 13.6734 6.5468C12.4415 6.99025 10.7891 7.25 9 7.25C7.21089 7.25 5.55849 6.99025 4.32656 6.5468C3.71378 6.32622 3.1649 6.04595 2.75502 5.69707C2.34812 5.35072 2 4.8646 2 4.25C2 3.6354 2.34812 3.14928 2.75502 2.80293C3.1649 2.45405 3.71378 2.17378 4.32656 1.9532Z"
                  fill="#70A7D7"
                />
              </svg>
              <div
                style={{
                  display: 'flex',
                  fontSize: '24px',
                  color: '#70A7D7',
                  fontWeight: 600,
                }}
              >
                cursor.link
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Geist',
            data: geistSemiBold,
            style: 'normal',
            weight: 600,
          },
          {
            name: 'Geist',
            data: geistMedium,
            style: 'normal',
            weight: 500,
          },
        ],
      }
    )
  } catch (error) {
    const fallbackText = 'Cursor Rule Not Found'
    const { geistSemiBold: fallbackFont } = await loadGeistFonts(fallbackText)
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#16171A',
            color: 'white',
            fontSize: '48px',
            fontWeight: 600,
            fontFamily: 'Geist',
          }}
        >
          Cursor Rule Not Found
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Geist',
            data: fallbackFont,
            style: 'normal',
            weight: 600,
          },
        ],
      }
    )
  }
}


