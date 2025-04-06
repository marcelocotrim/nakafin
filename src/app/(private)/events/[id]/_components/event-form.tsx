'use client';

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
import { CalendarIcon, ChevronsUpDown, Clock, Check, Upload } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useSession, admin } from "@/lib/auth-client";
import { toast } from "sonner";
import { Menu } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { Select, SelectItem } from "@/components/ui/select";
import { SelectContent, SelectValue } from "@/components/ui/select";
import { SelectTrigger } from "@/components/ui/select";
import { Command, CommandInput, CommandItem } from "@/components/ui/command";
import { CommandGroup } from "@/components/ui/command";
import { CommandEmpty } from "@/components/ui/command";
import { PersonInput } from "@/components/PersonInput";
import { EventWithRelations } from "@/types/event"

interface Location {
  id: string
  name: string
  children?: Location[]
}

const menuSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
    })),
  })),
  priceWithAlcohol: z.number(),
  priceWithoutAlcohol: z.number(),
});

const formSchema = z.discriminatedUnion('status', [
  // Draft Schema
  z.object({
    status: z.literal('DRAFT'),
    userId: z.string().min(1, 'Responsável é obrigatório'),
    contractorName: z.string().optional(),
    date: z.date({
      required_error: "Data é obrigatória",
    }),
    contractorId: z.string().min(1, 'Contratante é obrigatório'),
    operationId: z.string().min(1, 'Restaurante é obrigatório'),
    locationId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional().default(0),
    participantsQuantity: z.number().optional().default(1),
    menu: menuSchema.optional(),
  }),
  // Published Schema
  z.object({
    status: z.literal('PUBLISHED'),
    userId: z.string().min(1, 'Responsável é obrigatório'),
    contractorName: z.string().optional(),
    date: z.date({
      required_error: "Data é obrigatória",
    }),
    contractorId: z.string().min(1, 'Contratante é obrigatório'),
    operationId: z.string().min(1, 'Restaurante é obrigatório'),
    locationId: z.string().optional(),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    price: z.number().min(0.01, 'Preço deve ser maior que zero'),
    participantsQuantity: z.number().min(1, 'Quantidade de participantes deve ser maior que zero'),
    menu: menuSchema,
  }),
  // Cancelled Schema
  z.object({
    status: z.literal('CANCELLED'),
    userId: z.string().min(1, 'Responsável é obrigatório'),
    contractorName: z.string().optional(),
    date: z.date({
      required_error: "Data é obrigatória",
    }),
    contractorId: z.string().min(1, 'Contratante é obrigatório'),
    operationId: z.string().min(1, 'Restaurante é obrigatório'),
    locationId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional().default(0),
    participantsQuantity: z.number().optional().default(1),
    menu: menuSchema.optional(),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  onUpload: (menu: Menu) => void;
  event?: EventWithRelations;
}

const EventForm = ({ onUpload, event }: EventFormProps) => {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [userOpen, setUserOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [menu, setMenu] = useState<Menu | null>(event?.menu || null)

  // Check if the event is in the past
  const isPastEvent = event?.date ? new Date(event.date) < new Date() : false;

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

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await admin.listUsers({
        query: {
          limit: 100,
          offset: 0,
        },
      });
      return (data?.users as User[]) || [];
    },
  });

  // Sort users by name in ascending order
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  // Find the current user in the sorted users list
  const currentUser = sortedUsers.find(user => user.id === session?.user?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      price: event?.price || 0,
      date: event?.date ? new Date(event.date) : undefined,
      operationId: event?.location?.parent?.id || event?.location?.id || "",
      locationId: event?.location?.id || "",
      participantsQuantity: event?.participantsQuantity || 1,
      contractorId: event?.contractor?.id || "",
      contractorName: event?.contractor?.name || "",
      userId: event?.user?.id || session?.user?.id || "",
      status: (event?.status as "DRAFT" | "PUBLISHED" | "CANCELLED") || "DRAFT",
      menu: event?.menu || undefined,
    },
  })

  const selectedOperation = operations?.find(
    (op) => op.id === form.watch("operationId")
  )

  const createEventMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Failed to create event")
      }

      return response.json()
    },
    onSuccess: () => {
      router.push("/events")
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      toast.error(error.message || "Erro ao criar evento. Tente novamente.")
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch(`/api/event/${event?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update event")
      }

      return data
    },
    onSuccess: (data) => {
      toast.success(data.status === 'DRAFT' ? 'Evento salvo como rascunho' : 'Evento publicado com sucesso!');

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ['event', event?.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });

      router.push("/events")
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      toast.error(error.message || "Erro ao atualizar evento. Tente novamente.")
    },
  })

  const handleSubmit = async (data: FormValues) => {
    if (event) {
      await updateEventMutation.mutateAsync(data);
    } else {
      await createEventMutation.mutateAsync(data);
    }
  };

  const handleDraftSubmit = async () => {
    form.setValue('status', 'DRAFT');

    // Set userId to the logged-in user's ID if not already set
    if (!form.getValues('userId') && session?.user?.id) {
      form.setValue('userId', session.user.id);
    }

    // Trigger validation for required fields in draft mode
    const isValid = await form.trigger(['contractorId', 'date', 'operationId']);

    if (!isValid) {
      return;
    }

    // Get form values and add menu
    const formValues = form.getValues();
    const data = {
      ...formValues,
      menu: menu || undefined,
      locationId: formValues.locationId || formValues.operationId
    } as FormValues;

    await handleSubmit(data);
  };

  const handlePublishSubmit = async () => {
    console.log('handlePublishSubmit', form.getValues())
    form.setValue('status', 'PUBLISHED');

    // Set userId to the logged-in user's ID if not already set
    if (!form.getValues('userId') && session?.user?.id) {
      form.setValue('userId', session.user.id);
    }

    // Check if menu is required for published events
    if (!menu) {
      toast.error('Cardápio é obrigatório para eventos publicados');
      return;
    }

    // Trigger validation for all required fields in publish mode
    const isValid = await form.trigger();
    console.log(isValid)
    if (!isValid) {
      return;
    }

    // Get form values and add menu
    const formValues = form.getValues();
    const data = {
      ...formValues,
      menu,
      locationId: formValues.locationId || formValues.operationId
    } as FormValues;

    await handleSubmit(data);
  };

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
      onUpload(result.menu)

      // Set the menu value in the form
      form.setValue('menu', result.menu, { shouldValidate: true });

      toast.success('Cardápio processado com sucesso!')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar o cardápio')
    }
  }

  // Add this new function to handle the button click
  const handleUploadButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('cardapio-upload')?.click();
  }

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'participantsQuantity' || name === 'price') {
        const quantity = Number(form.getValues('participantsQuantity')) || 0;
        const basePrice = Number(form.getValues('price')) || 0;
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
    <>
      <Input
        type="file"
        accept=".docx"
        className="hidden"
        id="cardapio-upload"
        onChange={handleFileUpload}
        disabled={isPastEvent}
      />
      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Detalhes do Evento</h2>
            {menu && !isPastEvent && (
              <Button
                variant="outline"
                onClick={() => {
                  setMenu(null);
                }}
              >
                Trocar Cardápio
              </Button>
            )}
          </div>

          {isPastEvent && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md mb-4">
              <p className="text-sm">Este evento já ocorreu e não pode ser editado.</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável pelo Evento</FormLabel>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userOpen}
                        className="w-full justify-between"
                        disabled={isPastEvent}
                      >
                        {field.value
                          ? sortedUsers.find((user) => user.id === field.value)?.name
                          : currentUser?.name || "Selecione o responsável..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar responsável..."
                        value={userSearch}
                        onValueChange={setUserSearch}
                      />
                      <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                      <CommandGroup>
                        {sortedUsers
                          .filter(user =>
                            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.email.toLowerCase().includes(userSearch.toLowerCase())
                          )
                          .map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.name}
                              onSelect={() => {
                                field.onChange(user.id);
                                setUserOpen(false);
                                setUserSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Evento</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o título do evento" {...field} disabled={isPastEvent} />
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
                    className="min-h-[100px] resize-none text-sm"
                    {...field}
                    disabled={isPastEvent}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
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
                          disabled={isPastEvent}
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
                            disabled={isPastEvent}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              {Array.from({ length: 96 }, (_, i) => {
                                const hour = Math.floor(i / 4)
                                const minute = (i % 4) * 15
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
            name="operationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurante</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear location when operation changes
                    form.setValue('locationId', '', { shouldValidate: true });
                  }}
                  value={field.value}
                  disabled={isPastEvent}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um restaurante" />
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
                <FormLabel>Local (opcional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedOperation?.children?.length || isPastEvent}
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
            name="contractorId"
            render={() => (
              <FormItem>
                <FormLabel>Contratante</FormLabel>
                <FormControl>
                  <PersonInput
                    value={form.watch("contractorName") || ''}
                    onChange={(value, id) => {
                      form.setValue("contractorId", id || "", {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                      form.setValue("contractorName", value || "");
                    }}
                    disabled={isPastEvent}
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
                  <Input
                    type="number"
                    placeholder="Número de participantes"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      field.onChange(value);
                    }}
                    disabled={isPastEvent}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    const quantity = Number(form.getValues('participantsQuantity')) || 0;
                    const calculatedTotal = quantity * Number(value);
                    const totalElement = document.getElementById('total-price');
                    if (totalElement) {
                      totalElement.textContent = `Total: R$ ${calculatedTotal.toFixed(2)}`;
                    }
                  }}
                  value={field.value.toString()}
                  disabled={!menu?.priceWithAlcohol && !menu?.priceWithoutAlcohol || isPastEvent}
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

          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              {menu ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setMenu(null);
                    onUpload({
                      title: "",
                      sections: [],
                      priceWithAlcohol: 0,
                      priceWithoutAlcohol: 0
                    });
                    toast.success('Cardápio removido com sucesso!');
                  }}
                  disabled={isPastEvent}
                >
                  Remover Cardápio
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleUploadButtonClick}
                  disabled={isPastEvent}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Cardápio
                </Button>
              )}
            </div>

            {!menu && (
              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  O cardápio é obrigatório apenas para eventos publicados.
                </p>
              </div>
            )}
          </div>

          {!isPastEvent && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={createEventMutation.isPending}
                onClick={handleDraftSubmit}
              >
                {createEventMutation.isPending ? "Salvando..." : "Salvar como Rascunho"}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={createEventMutation.isPending}
                onClick={handlePublishSubmit}
              >
                {createEventMutation.isPending ? "Criando..." : "Publicar Evento"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </>
  )
}

export default EventForm
