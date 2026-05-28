import { NextRequest, NextResponse } from "next/server"
import * as line from "@line/bot-sdk"
import { getFaq } from "@/lib/sheet"
import { askGemini } from "@/lib/gemini"

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("x-line-signature") || ""

  const isValid = line.validateSignature(
    body,
    process.env.LINE_CHANNEL_SECRET || "",
    signature
  )

  if (!isValid) {
    console.error("[webhook] invalid signature")
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  const events: line.WebhookEvent[] = JSON.parse(body).events

  await Promise.allSettled(
    events.map(async (event) => {
      if (event.type !== "message") return
      if (event.message.type !== "text") return

      const userMessage = event.message.text
      const replyToken = event.replyToken

      console.log("[webhook] user:", userMessage)

      const faq = await getFaq()
      const reply = await askGemini(userMessage, faq)

      console.log("[webhook] reply:", reply)

      await client.replyMessage({
        replyToken,
        messages: [{ type: "text", text: reply }],
      })
    })
  )

  return NextResponse.json({ ok: true })
}