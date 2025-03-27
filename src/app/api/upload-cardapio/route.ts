import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { parseMenuContent } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Convert DOCX to text using mammoth
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    const menu = parseMenuContent(text)
    console.log({ section : menu?.sections?.at(0) })

    return NextResponse.json({ menu })
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar o arquivo' },
      { status: 500 }
    )
  }
} 