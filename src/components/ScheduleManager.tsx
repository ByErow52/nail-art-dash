import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleOverride {
  id: string;
  date_from: string;
  date_to: string;
  is_working: boolean;
  reason: string | null;
  created_at: string;
  time_from: string | null;
  time_to: string | null;
}

const ScheduleManager = () => {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [vacationFrom, setVacationFrom] = useState<Date | undefined>();
  const [vacationTo, setVacationTo] = useState<Date | undefined>();
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [workDate, setWorkDate] = useState<Date | undefined>();
  const [timeBlockDate, setTimeBlockDate] = useState<Date | undefined>();
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    const { data } = await supabase
      .from('schedule_overrides')
      .select('*')
      .order('date_from', { ascending: true });

    if (data) {
      setOverrides(data);
    }
  };

  const handleAddVacation = async () => {
    if (!vacationFrom || !vacationTo) {
      toast({
        title: "Ошибка",
        description: "Выберите начало и конец отпуска",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedule_overrides')
        .insert({
          date_from: format(vacationFrom, 'yyyy-MM-dd'),
          date_to: format(vacationTo, 'yyyy-MM-dd'),
          is_working: false,
          reason: reason || 'Отпуск',
        });

      if (error) throw error;

      toast({
        title: "Отпуск добавлен",
        description: `Период с ${format(vacationFrom, 'dd.MM.yyyy')} по ${format(vacationTo, 'dd.MM.yyyy')} заблокирован`,
      });

      setVacationFrom(undefined);
      setVacationTo(undefined);
      setReason("");
      fetchOverrides();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDay = async () => {
    if (!blockDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(blockDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('schedule_overrides')
        .insert({
          date_from: dateStr,
          date_to: dateStr,
          is_working: false,
          reason: reason || 'Выходной день',
        });

      if (error) throw error;

      toast({
        title: "День заблокирован",
        description: `${format(blockDate, 'dd.MM.yyyy')} отмечен как выходной`,
      });

      setBlockDate(undefined);
      setReason("");
      fetchOverrides();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkDay = async () => {
    if (!workDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(workDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('schedule_overrides')
        .insert({
          date_from: dateStr,
          date_to: dateStr,
          is_working: true,
          reason: reason || 'Рабочий день',
        });

      if (error) throw error;

      toast({
        title: "Рабочий день добавлен",
        description: `${format(workDate, 'dd.MM.yyyy')} отмечен как рабочий`,
      });

      setWorkDate(undefined);
      setReason("");
      fetchOverrides();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockTimeSlot = async () => {
    if (!timeBlockDate || !timeFrom || !timeTo) {
      toast({
        title: "Ошибка",
        description: "Выберите дату, время начала и время окончания",
        variant: "destructive",
      });
      return;
    }

    if (timeFrom >= timeTo) {
      toast({
        title: "Ошибка",
        description: "Время окончания должно быть позже времени начала",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(timeBlockDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('schedule_overrides')
        .insert({
          date_from: dateStr,
          date_to: dateStr,
          is_working: false,
          time_from: timeFrom,
          time_to: timeTo,
          reason: reason || 'Временной интервал заблокирован',
        });

      if (error) throw error;

      toast({
        title: "Интервал заблокирован",
        description: `${format(timeBlockDate, 'dd.MM.yyyy')} с ${timeFrom} до ${timeTo} недоступен`,
      });

      setTimeBlockDate(undefined);
      setTimeFrom("");
      setTimeTo("");
      setReason("");
      fetchOverrides();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Удалено",
        description: "Переопределение расписания удалено",
      });

      fetchOverrides();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Отпуск</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Начало отпуска</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={vacationFrom}
                  onSelect={setVacationFrom}
                  locale={ru}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Конец отпуска</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={vacationTo}
                  onSelect={setVacationTo}
                  locale={ru}
                  disabled={(date) => vacationFrom ? date < vacationFrom : false}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Примечание (необязательно)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например: Летний отпуск"
              />
            </div>
            <Button 
              onClick={handleAddVacation} 
              disabled={loading}
              className="w-full"
            >
              Добавить отпуск
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Не работаю</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите дату</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={blockDate}
                  onSelect={setBlockDate}
                  locale={ru}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Причина (необязательно)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например: Личные дела"
              />
            </div>
            <Button 
              onClick={handleBlockDay} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              Заблокировать день
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Работаю</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите дату</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={workDate}
                  onSelect={setWorkDate}
                  locale={ru}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Примечание (необязательно)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например: Дополнительный день"
              />
            </div>
            <Button 
              onClick={handleAddWorkDay} 
              disabled={loading}
              className="w-full"
            >
              Добавить рабочий день
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Заблокировать временной интервал</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Выберите дату</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={timeBlockDate}
                  onSelect={setTimeBlockDate}
                  locale={ru}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time_from">Время начала</Label>
                <Input
                  id="time_from"
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  placeholder="09:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_to">Время окончания</Label>
                <Input
                  id="time_to"
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  placeholder="10:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_reason">Причина (необязательно)</Label>
                <Textarea
                  id="time_reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Например: Обед, Личное время"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleBlockTimeSlot} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                Заблокировать интервал
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Все переопределения</CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Нет активных переопределений расписания
            </p>
          ) : (
            <div className="space-y-2">
              {overrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(override.date_from), 'dd.MM.yyyy')}
                        {override.date_from !== override.date_to && 
                          ` - ${format(new Date(override.date_to), 'dd.MM.yyyy')}`
                        }
                        {override.time_from && override.time_to && 
                          ` (${override.time_from.slice(0, 5)} - ${override.time_to.slice(0, 5)})`
                        }
                      </div>
                      {override.reason && (
                        <div className="text-sm text-muted-foreground">
                          {override.reason}
                        </div>
                      )}
                    </div>
                    <Badge variant={override.is_working ? "default" : "secondary"}>
                      {override.is_working ? "Рабочий" : override.time_from && override.time_to ? "Частично" : "Выходной"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(override.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManager;
