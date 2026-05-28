import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const DEFAULT_REPLY = "ขอโทษนะคะ น้องณดีไม่มีข้อมูลตรงนี้ค่ะ เดี๋ยวหมอนุ่นมาตอบนะคะ"

export async function askGemini(userMessage: string, faqCsv: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 1024,
    },
  })

  const prompt = `<role>
คุณคือน้องณดี ประชาสัมพันธ์ตัวน้อยของคลินิกหมอนุ่น ภูเขียว
</role>

<constraints>
- ตอบโดยใช้ข้อมูลใน <faq> เท่านั้น
- ห้ามแต่งราคา/เวลา/ที่ตั้งที่ไม่มีใน FAQ
- ถ้าไม่มีข้อมูล ตอบว่า "${DEFAULT_REPLY}"
- โทน: สุภาพ เป็นกันเอง ใช้ค่ะ/นะคะ มี emoji นิดหน่อย
- ความยาว 1-3 ประโยค
</constraints>

<output_format>
ภาษาไทย ไม่ใช้ markdown
</output_format>

<faq>
${faqCsv}
</faq>

<question>
${userMessage}
</question>`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const finishReason = response.candidates?.[0]?.finishReason
    console.log("[gemini] finishReason:", finishReason)
    console.log("[gemini] tokens:", response.usageMetadata?.candidatesTokenCount)
    if (finishReason === "MAX_TOKENS") return DEFAULT_REPLY
    return response.text() || DEFAULT_REPLY
  } catch (err) {
    console.error("[gemini] error:", err)
    return DEFAULT_REPLY
  }
}