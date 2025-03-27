"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock, Upload, Home } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PersonInput } from '@/components/PersonInput'
import { useState, useEffect } from "react"
import { Menu } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Location {
  id: string
  name: string
  children?: Location[]
}

const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  eventDate: z.date({
    required_error: "A data do evento é obrigatória.",
  }),
  responsiblePerson: z.string().min(2, {
    message: "O responsável é obrigatório.",
  }),
  responsiblePersonId: z.string().optional(),
  participantsQuantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "A quantidade de participantes deve ser um número maior que 0.",
  }),
  operationId: z.string({
    required_error: "A operação é obrigatória.",
  }),
  locationId: z.string({
    required_error: "O local é obrigatório.",
  }),
  basePrice: z.string().min(1, {
    message: "O preço é obrigatório.",
  }).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "O preço deve ser um número maior ou igual a 0.",
  }),
})

export default function EventForm() {
  const router = useRouter()
  const [menu, setMenu] = useState<Menu | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      responsiblePerson: "",
      responsiblePersonId: "",
      participantsQuantity: "",
      operationId: "",
      locationId: "",
      basePrice: "",
    },
  })

  const { data: operations } = useQuery<Location[]>({
    queryKey: ["operations"],
    queryFn: async () => {
      const response = await fetch("/api/location")
      if (!response.ok) {
        throw new Error("Failed to fetch operations")
      }
      return response.json()
    },
  })

  const selectedOperation = operations?.find(
    (op) => op.id === form.watch("operationId")
  )

  const createEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const quantity = Number(values.participantsQuantity) || 0;
      const basePrice = Number(values.basePrice) || 0;

      const response = await fetch("/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: values.title,
          description: values.description,
          price: basePrice,
          date: values.eventDate.toISOString(),
          locationId: values.locationId || values.operationId,
          participantsQuantity: quantity,
          responsiblePersonId: values.responsiblePersonId,
          menu,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Failed to create event")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Evento criado com sucesso!")
      router.push("/")
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      toast.error(error.message || "Erro ao criar evento. Tente novamente.")
    },
  })

  const handleSubmit = async () => {
    console.log('Button clicked')
    const isValid = await form.trigger()
    console.log('Form validation result:', isValid)
    console.log('Form errors:', form.formState.errors)

    if (isValid) {
      const values = form.getValues()
      console.log('Form values:', values)
      createEventMutation.mutate(values)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-cardapio', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar o arquivo')
      }

      if (!result.menu) {
        throw new Error('Dados do cardápio não encontrados na resposta')
      }

      setMenu(result.menu)
      toast.success('Cardápio processado com sucesso!')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar o cardápio')
    }
  }

  // Update the useEffect to calculate total when either price or quantity changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'participantsQuantity' || name === 'basePrice') {
        const quantity = Number(form.getValues('participantsQuantity')) || 0;
        const basePrice = Number(form.getValues('basePrice')) || 0;
        const calculatedTotal = quantity * basePrice;

        // Update the total display
        const totalElement = document.getElementById('total-price');
        if (totalElement) {
          totalElement.textContent = `Total: R$ ${calculatedTotal.toFixed(2)}`;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="p-4 mt-16">
      <div className="flex flex-col gap-4 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Cadastro de Evento</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Cadastro de Evento</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {!menu ? (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Upload do Cardápio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Para começar a cadastrar um novo evento, primeiro faça o upload do cardápio.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O cardápio deve ser um arquivo .docx contendo:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Título do cardápio</li>
                    <li>Seções com seus respectivos itens</li>
                    <li>Preços com e sem álcool</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <Input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    id="cardapio-upload"
                    onChange={handleFileUpload}
                  />

                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('cardapio-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Cardápio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Form {...form}>
              <form className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Detalhes do Evento</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMenu(null);
                      form.reset();
                    }}
                  >
                    Trocar Cardápio
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título do evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite uma observação para o evento (opcional)"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data e Hora do Evento</FormLabel>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP 'às' HH:mm", { locale: ptBR })
                                ) : (
                                  <span>Selecione data e hora</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 border-b border-border">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <Select
                                  value={field.value ? format(field.value, "HH:mm") : ""}
                                  onValueChange={(value) => {
                                    const [hours, minutes] = value.split(":")
                                    const newDate = field.value || new Date()
                                    newDate.setHours(parseInt(hours), parseInt(minutes))
                                    field.onChange(newDate)
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o horário" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px] overflow-y-auto">
                                    {Array.from({ length: 48 }, (_, i) => {
                                      const hour = Math.floor(i / 2)
                                      const minute = (i % 2) * 30
                                      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                      return (
                                        <SelectItem key={time} value={time}>
                                          {time}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  const currentTime = field.value || new Date()
                                  date.setHours(currentTime.getHours(), currentTime.getMinutes())
                                  field.onChange(date)
                                } else {
                                  field.onChange(date)
                                }
                              }}
                              disabled={(date: Date) =>
                                date < new Date()
                              }
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsiblePerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <PersonInput
                          value={field.value}
                          onChange={(value, id) => {
                            field.onChange(value);
                            form.setValue('responsiblePersonId', id || '');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantsQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Participantes</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Número de participantes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma operação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {operations?.map((operation) => (
                            <SelectItem key={operation.id} value={operation.id}>
                              {operation.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedOperation?.children?.length}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !selectedOperation?.children?.length
                                ? "Selecione uma operação primeiro"
                                : "Selecione um local"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedOperation?.children?.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const quantity = Number(form.getValues('participantsQuantity')) || 0;
                          const calculatedTotal = quantity * Number(value);
                          const totalElement = document.getElementById('total-price');
                          if (totalElement) {
                            totalElement.textContent = `Total: R$ ${calculatedTotal.toFixed(2)}`;
                          }
                        }}
                        value={field.value}
                        disabled={!menu?.priceWithAlcohol && !menu?.priceWithoutAlcohol}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o preço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {menu?.priceWithAlcohol && (
                            <SelectItem value={menu.priceWithAlcohol.toString()}>
                              <div className="flex justify-between items-center w-full">
                                <span>Com Álcool</span>
                                <span className="font-medium">
                                  R$ {menu.priceWithAlcohol.toFixed(2)}
                                </span>
                              </div>
                            </SelectItem>
                          )}
                          {menu?.priceWithoutAlcohol && (
                            <SelectItem value={menu.priceWithoutAlcohol.toString()}>
                              <div className="flex justify-between items-center w-full">
                                <span>Sem Álcool</span>
                                <span className="font-medium">
                                  R$ {menu.priceWithoutAlcohol.toFixed(2)}
                                </span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p id="total-price" className="text-sm text-muted-foreground mt-2">
                        Total: R$ 0,00
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  className="w-full"
                  disabled={createEventMutation.isPending}
                  onClick={handleSubmit}
                >
                  {createEventMutation.isPending ? "Criando..." : "Cadastrar Evento"}
                </Button>
              </form>
            </Form>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          {menu && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>{menu.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {menu.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-base font-medium text-muted-foreground">{section.title}</h3>
                    <div className="grid gap-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center py-1">
                          <div>
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Com Álcool:</span>
                    <span className="text-sm font-medium">
                      R$ {menu.priceWithAlcohol.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Sem Álcool:</span>
                    <span className="text-sm font-medium">
                      R$ {menu.priceWithoutAlcohol.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
