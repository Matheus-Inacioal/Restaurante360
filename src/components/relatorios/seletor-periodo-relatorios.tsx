import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PeriodoRelatorio } from '@/hooks/use-relatorios';

interface SeletorPeriodoRelatoriosProps {
    periodo: PeriodoRelatorio;
    dataInicial?: Date;
    dataFinal?: Date;
    onChange: (valores: { periodo: PeriodoRelatorio; dataInicial?: Date; dataFinal?: Date }) => void;
}

export function SeletorPeriodoRelatorios({
    periodo,
    dataInicial,
    dataFinal,
    onChange,
}: SeletorPeriodoRelatoriosProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState<DateRange | undefined>({
        from: dataInicial,
        to: dataFinal,
    });

    const handlePeriodoChange = (value: PeriodoRelatorio) => {
        if (value === 'personalizado') {
            onChange({ periodo: value, dataInicial, dataFinal });
        } else {
            onChange({ periodo: value, dataInicial: undefined, dataFinal: undefined });
        }
    };

    const handleApply = () => {
        if (tempRange?.from && tempRange?.to) {
            onChange({
                periodo: 'personalizado',
                dataInicial: tempRange.from,
                dataFinal: tempRange.to,
            });
            setIsOpen(false);
        }
    };

    const handleCancel = () => {
        setTempRange({ from: dataInicial, to: dataFinal });
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setTempRange({ from: dataInicial, to: dataFinal });
        }
        setIsOpen(open);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <Select value={periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
            </Select>

            {periodo === 'personalizado' && (
                <Popover open={isOpen} onOpenChange={handleOpenChange}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-[260px] justify-start text-left font-normal bg-background',
                                !dataInicial && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {dataInicial && dataFinal ? (
                                <span className="truncate">
                                    {format(dataInicial, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                                    {format(dataFinal, 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                            ) : (
                                <span>Escolha o período</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={tempRange?.from}
                            selected={tempRange}
                            onSelect={setTempRange}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                        <div className="flex items-center justify-end gap-2 p-3 border-t">
                            <Button variant="outline" size="sm" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={!tempRange?.from || !tempRange?.to}
                            >
                                Aplicar
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
