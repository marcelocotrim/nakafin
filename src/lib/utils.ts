import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import mammoth from "mammoth"
import { Document, Packer, Paragraph, TextRun } from "docx"
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EventWithRelations } from '@/types/event'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DocxContent {
  text: string
  html: string
  messages: Array<{
    type: string
    message: string
  }>
  menu?: Menu
}

export interface MenuItem {
  name: string
  description?: string
}

export interface MenuSection {
  title: string
  items: MenuItem[]
}

export interface Menu {
  title: string
  sections: MenuSection[]
  priceWithAlcohol: number
  priceWithoutAlcohol: number
}

export interface MenuPrices {
  withAlcohol: number;
  withoutAlcohol: number;
}

interface EventForm {
  os: string;
  evento: string;
  pax: string;
  contratante: string;
  data: string;
  horario: string;
  operacao: string;
  solicitacao: string;
  pagamento: string;
  total: string;
  servico: string;
  comidas: string;
  responsavel: string;
}

function validateMenuContent(content: string): { isValid: boolean; error?: string } {
  const lines = content.split('\n').filter(line => line.trim())
  
  // Check if we have at least a title
  if (lines.length === 0) {
    return { isValid: false, error: 'O conteúdo do cardápio está vazio' }
  }

  // Check if we have any sections (lines ending with colon)
  const hasSections = lines.some(line => line.trim().endsWith(':'))
  if (!hasSections) {
    return { isValid: false, error: 'O cardápio deve ter pelo menos uma seção (título terminando com dois pontos)' }
  }

  // Check if we have price information at the bottom
  const hasPriceInfo = lines.some(line => line.includes('Preço por pessoa'))
  if (!hasPriceInfo) {
    return { isValid: false, error: 'O cardápio deve ter informações de preço (Preço por pessoa)' }
  }

  // Check if we have at least one food item (uppercase) or beverage item
  const hasItems = lines.some(line => {
    const trimmedLine = line.trim()
    return trimmedLine === trimmedLine.toUpperCase() || 
           (trimmedLine && lines.some(l => l.trim().toLowerCase().includes('bebida')))
  })
  if (!hasItems) {
    return { isValid: false, error: 'O cardápio deve ter pelo menos um item' }
  }

  return { isValid: true }
}

export function parseMenuContent(content: string): Menu {
  const validation = validateMenuContent(content)
  if (!validation.isValid) {
    throw new Error(`Invalid menu format: ${validation.error}`)
  }

  const lines = content.split('\n').filter(line => line.trim())
  const menu: Menu = {
    title: lines[0].replace('// ', ''),
    sections: [],
    priceWithAlcohol: 0,
    priceWithoutAlcohol: 0
  }

  let currentSection: MenuSection | null = null

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace('// ', '').trim()
    
    if (!line) continue

    // Check for price information at the bottom
    if (line.includes('Preço por pessoa')) {
      const priceLines = lines.slice(i + 1).filter(l => l.trim())
      if (priceLines.length >= 2) {
        const withoutAlcoholMatch = priceLines[0].match(/R\$\s*(\d+,\d+)/)
        const withAlcoholMatch = priceLines[1].match(/R\$\s*(\d+,\d+)/)
        
        if (!withoutAlcoholMatch || !withAlcoholMatch) {
          throw new Error('Invalid price format. Expected format: R$ XXX,XX')
        }
        
        menu.priceWithoutAlcohol = parseFloat(withoutAlcoholMatch[1].replace(',', '.'))
        menu.priceWithAlcohol = parseFloat(withAlcoholMatch[1].replace(',', '.'))
      } else {
        throw new Error('Missing price information. Expected both with and without alcohol prices')
      }
      break
    }

    // Check if this is a section title (ends with colon)
    if (line.endsWith(':')) {
      if (currentSection) {
        menu.sections.push(currentSection)
      }
      currentSection = {
        title: line.replace(':', ''),
        items: []
      }
      continue
    }

    // If we have a current section, process the line
    if (currentSection) {
      // For beverage sections, treat every non-empty line as an item
      if (currentSection.title.toLowerCase().includes('bebida')) {
        currentSection.items.push({
          name: line
        })
      } 
      // For food sections, look for uppercase items with descriptions
      else if (line === line.toUpperCase()) {
        // Get the next line as description if it exists
        const description = i + 1 < lines.length ? lines[i + 1].replace('// ', '').trim() : ''
        
        if (!description) {
          throw new Error(`Missing description for food item: ${line}`)
        }
        
        currentSection.items.push({
          name: line,
          description
        })
        
        // Skip the next line since we've already used it as description
        i++
      }
    }
  }

  // Add the last section
  if (currentSection) {
    menu.sections.push(currentSection)
  }

  // Validate final menu structure
  if (menu.sections.length === 0) {
    throw new Error('Menu must have at least one section')
  }

  if (menu.priceWithAlcohol === 0 || menu.priceWithoutAlcohol === 0) {
    throw new Error('Invalid prices: both with and without alcohol prices must be greater than 0')
  }

  return menu
}

export async function convertDocxToObject(file: File): Promise<DocxContent> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    
    // Extract text content and parse menu
    const textContent = result.value
    const menu = parseMenuContent(textContent)
    return {
      text: textContent,
      html: textContent, // Using text content as HTML since we're not converting to HTML anymore
      messages: result.messages,
      menu
    }
  } catch (error) {
    throw new Error(`Failed to convert DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function convertObjectToDocx(content: DocxContent): Promise<Buffer> {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: content.menu?.title || '',
                bold: true,
                size: 32
              })
            ]
          }),
          ...(content.menu?.sections.flatMap(section => [
            new Paragraph({
              children: [
                new TextRun({
                  text: section.title,
                  bold: true,
                  size: 24
                })
              ]
            }),
            ...section.items.map(item => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${item.name}${item.description ? `\n${item.description}` : ''}`,
                    size: 24
                  })
                ]
              })
            )
          ]) || []),
          new Paragraph({
            children: [
              new TextRun({
                text: `\nPreço por pessoa:\nR$ ${content.menu?.priceWithoutAlcohol.toFixed(2)} (sem bebidas alcoólicas)\nR$ ${content.menu?.priceWithAlcohol.toFixed(2)} (com bebidas alcoólicas)`,
                bold: true,
                size: 24
              })
            ]
          })
        ]
      }]
    })

    return await Packer.toBuffer(doc)
  } catch (error) {
    throw new Error(`Failed to convert object to DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function fillEventForm(template: ArrayBuffer, data: EventForm): Promise<Uint8Array> {
  // Create a new instance of PizZip with the template
  const zip = new PizZip(template)
  
  // Create a new instance of Docxtemplater
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  // Render the document with the data
  doc.render({
    OS: data.os,
    EVENTO: data.evento,
    PAX: data.pax,
    CONTRATANTE: data.contratante,
    DATA: data.data,
    HORARIO: data.horario,
    OPERACAO: data.operacao,
    SOLICITACAO: data.solicitacao,
    PAGAMENTO: data.pagamento,
    TOTAL: data.total,
    SERVICO: data.servico,
    COMIDAS: data.comidas,
    RESPONSAVEL: data.responsavel,
  })

  // Generate the document
  const out = doc.getZip().generate({
    type: 'uint8array',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  return out
}

async function generateServiceOrder(templateFile: File, event: EventWithRelations) {
  try {
    // Read the template file
    const templateContent = await templateFile.arrayBuffer()
    
    // Format the date
    const eventDate = format(new Date(event.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    const eventTime = format(new Date(event.date), "HH:mm")
    const os = format(new Date(event.date), "dd-MM-yy", { locale: ptBR })
    
    // Format the menu sections
    const menuSections = event.menu.sections.map((section: { title: string; items: Array<{ name: string; description?: string }> }) => {
      const items = section.items.map((item:  { name: string; description?: string }) => 
        `${item.name}${item.description ? ` - ${item.description}` : ''}`
      ).join('\n')
      return `${section.title}:\n${items}`
    }).join('\n\n')

    // Fill the form
    const filledDoc = await fillEventForm(templateContent, {
      os,
      evento: event.title || "-",
      pax: event.participantsQuantity?.toString() || "-",
      contratante: event.location.parent?.name || event.location.name,
      data: eventDate,
      horario: eventTime,
      operacao: `Restaurante ${event.location.parent?.name || event.location.name}, ${event.location.name}`,
      solicitacao: event.description || "-",
      pagamento: `${event.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}+serviço= ${event.priceWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Por pessoa.`,
      total: `${event.priceWithServiceFee} x ${event.participantsQuantity} = ${event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      Pagamento mínimo: ${event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${event.discount ? `${event.discount * 100}%` : ''} = ${event.totalWithServiceFeeAndDiscount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      servico: "-",
      comidas: menuSections,
      responsavel: event.user.name || "-",
    })

    // Create a blob and download the file
    const blob = new Blob([filledDoc], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ordem-servico-${event.id.slice(-6).toLowerCase()}.docx`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating service order:', error)
    throw error
  }
}

export { generateServiceOrder }