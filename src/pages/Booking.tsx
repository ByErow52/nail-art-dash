import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, format, isWithinInterval, parse } from "date-fns";
import { ru } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

const Booking = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [workCycleStart, setWorkCycleStart] = useState<Date>(new Date(2025, 9, 25));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    fetchServices();
    fetchSettings();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'work_cycle_start')
      .maybeSingle();

    if (data?.value) {
      const dateStr = JSON.parse(data.value as string);
      setWorkCycleStart(new Date(dateStr));
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (data) {
      setServices(data);
    }
  };

  const isWorkingDay = (date: Date): boolean => {
    const daysDiff = Math.floor((date.getTime() - workCycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysDiff % 4;
    return cycleDay === 0 || cycleDay === 1;
  };

  const getAvailableTimes = (): string[] => {
    if (!selectedDate) return [];

    const isSunday = selectedDate.getDay() === 0;
    const endHour = isSunday ? 18 : 20;
    const times: string[] = [];

    for (let hour = 9; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }

    return times;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          service_id: selectedService,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          notes: notes || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Запись создана!",
        description: "Мы ждем вас в назначенное время",
      });

      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Ошибка создания записи",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Онлайн запись</h1>
          <p className="text-muted-foreground">
            Выберите услугу, дату и время для записи
          </p>
        </div>

        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle>Создать запись</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service">Выберите услугу *</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {service.price} MDL ({service.duration} мин)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Выберите дату *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date < new Date() ||
                    date > addDays(new Date(), 60) ||
                    !isWorkingDay(date)
                  }
                  locale={ru}
                  className="rounded-md border"
                />
                <p className="text-sm text-muted-foreground">
                  Работаем 2 дня / 2 дня выходных. Доступны только рабочие дни.
                </p>
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label htmlFor="time">Выберите время *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите время" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {getAvailableTimes().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Примечания (необязательно)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Дополнительные пожелания..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Создание записи..." : "Записаться"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
