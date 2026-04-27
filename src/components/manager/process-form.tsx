'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import type { ActivityTemplate, Process, User, UserRole } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '../ui/switch';


import { ComboboxCategoria } from '../categorias/combobox-categoria';
import { ModalGerenciarCategorias } from '../categorias/modal-gerenciar-categorias';

const taskSchema = z.object({
  title: z.string().min(3, "O título da tarefa deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  requiresPhoto: z.boolean(),
});

const formSchema = z.object({
  name: z.string().min(3, 'O nome da rotina deve ter pelo menos 3 caracteres.'),
  categoryId: z.string({ required_error: "Selecione uma categoria." }).min(1, 'Selecione uma categoria.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  tasks: z.array(taskSchema).min(1, 'Você precisa adicionar pelo menos uma tarefa à rotina.'),
});

type ProcessFormValues = z.infer<typeof formSchema>;

interface ProcessFormProps {
  onSuccess: () => void;
}

export function ProcessForm({ onSuccess }: ProcessFormProps) {
  const { toast } = useToast();
  const [createdProcess, setCreatedProcess] = useState<Process | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // State for the assignment dialog
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [shift, setShift] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
      const fetchUsers = async () => {
          try {
              const res = await fetch('/api/empresa/usuarios');
              const data = await res.json();
              if (res.ok && data.sucesso) {
                  setUsers(data.usuarios);
              }
          } catch (err) {
              console.error("Erro ao buscar usuários:", err);
          } finally {
              setIsLoadingUsers(false);
          }
      };
      fetchUsers();
  }, []);

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      tasks: [{ title: '', description: '', requiresPhoto: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks"
  });


  async function onSubmit(values: ProcessFormValues) {
    try {
      const res = await fetch('/api/empresa/processos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.issues) {
          Object.entries(data.issues).forEach(([field, messages]) => {
            form.setError(field as any, { message: (messages as string[])[0] });
          });
          throw new Error("Verifique os campos em vermelho.");
        }
        throw new Error(data.message || 'Erro ao criar rotina.');
      }

      toast({
        title: 'Rotina criada com sucesso!',
        description: `A rotina "${values.name}" foi salva. Agora atribua-a como um checklist.`,
      });

      const finalProcess: Process = {
        id: data.data.processId,
        name: data.data.name,
        categoryId: data.data.categoryId,
        description: data.data.description,
        activityIds: data.data.activityIds,
        isActive: true,
        createdBy: '', // Será definido pela API se necessário
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      sessionStorage.setItem('createdActivities', JSON.stringify(data.data.createdActivities));
      setCreatedProcess(finalProcess);
      setIsAssignDialogOpen(true);
      form.reset();

    } catch (error: any) {
      console.error('Error saving process: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um problema ao salvar a rotina.',
      });
    }
  }

  const handleAssignChecklist = async () => {
    if (!createdProcess || !assignedTo || !date) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos para atribuir o checklist.", variant: "destructive" });
      return;
    }

    const createdActivitiesStr = sessionStorage.getItem('createdActivities');
    const activitiesToUse: any[] = createdActivitiesStr ? JSON.parse(createdActivitiesStr) : [];

    if (activitiesToUse.length === 0) {
      toast({ title: "Erro", description: "Não foi possível encontrar as tarefas da rotina.", variant: "destructive" });
      return;
    }

    const payload = {
      processId: createdProcess.id,
      processName: createdProcess.name,
      assignedTo,
      shift,
      dateStr: format(date, 'yyyy-MM-dd'),
      tasks: activitiesToUse.map(activity => ({
        activityTemplateId: activity.id,
        title: activity.title,
        description: activity.description,
        requiresPhoto: activity.requiresPhoto
      }))
    };

    try {
      const res = await fetch('/api/empresa/checklists/atribuir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Erro ao atribuir rotina.');

      toast({
        title: "Checklist Atribuído!",
        description: `A rotina "${createdProcess.name}" foi atribuída com sucesso.`
      });
      setIsAssignDialogOpen(false);
      setCreatedProcess(null);
      sessionStorage.removeItem('createdActivities');
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning checklist: ", error);
      toast({ title: "Erro ao Atribuir", description: error.message || "Não foi possível criar o checklist.", variant: "destructive" });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Rotina</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Rotina de Abertura da Cozinha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Categoria</FormLabel>
                <ComboboxCategoria
                  tipo="processos"
                  value={field.value}
                  onChange={field.onChange}
                  onManageClick={() => setIsCategoriesModalOpen(true)}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o objetivo desta rotina."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Tarefas da Rotina</FormLabel>
            <FormDescription>Adicione as tarefas que fazem parte desta rotina.</FormDescription>
            <div className="space-y-4 mt-4">
              {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
                  <FormField
                    control={form.control}
                    name={`tasks.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Tarefa {index + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Verificar temperatura das geladeiras" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`tasks.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalhes sobre a tarefa..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`tasks.${index}.requiresPhoto`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Exige foto como evidência</FormLabel>
                      </FormItem>
                    )}
                  />

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ title: '', description: '', requiresPhoto: false })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Tarefa
              </Button>
              <FormMessage>{form.formState.errors.tasks?.message}</FormMessage>
            </div>
          </div>


          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Criar Rotina e Atribuir'}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Checklist de Rotina</DialogTitle>
            <DialogDescription>
              A rotina "{createdProcess?.name}" foi criada. Agora atribua-a como um checklist para um colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assign-user">Colaborador</Label>
              <Select onValueChange={setAssignedTo} value={assignedTo}>
                <SelectTrigger id="assign-user">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                  {users?.filter(u => u.role !== 'gestor').map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign-shift">Turno</Label>
              <Select onValueChange={(v) => setShift(v as 'Manhã' | 'Tarde' | 'Noite')} value={shift}>
                <SelectTrigger id="assign-shift">
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                  <SelectItem value="Noite">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAssignDialogOpen(false); onSuccess(); }}>Pular</Button>
            <Button onClick={handleAssignChecklist}>Atribuir Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ModalGerenciarCategorias
        tipo="processos"
        aberto={isCategoriesModalOpen}
        aoMudarEstado={setIsCategoriesModalOpen}
      />
    </>
  );
}
