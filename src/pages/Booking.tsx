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
import { addDays, format, startOfDay, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [workCycleStart, setWorkCycleStart] = useState<Date>(new Date(2025, 9, 25));
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<any[]>([]);

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
    fetchScheduleOverrides();

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

  const fetchScheduleOverrides = async () => {
    const { data } = await supabase
      .from('schedule_overrides')
      .select('*')
      .gte('date_to', format(new Date(), 'yyyy-MM-dd'));

    if (data) {
      setScheduleOverrides(data);
    }
  };

  const isWorkingDay = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Специальная блокировка для 27 октября (всегда недоступна)
    if (isSameDay(date, new Date(2025, 9, 27))) {
      return false;
    }
    
    // Проверяем переопределения расписания
    for (const override of scheduleOverrides) {
      const overrideStart = new Date(override.date_from);
      const overrideEnd = new Date(override.date_to);
      
      if (date >= overrideStart && date <= overrideEnd) {
        return override.is_working;
      }
    }
    
    // Стандартная логика: 2 дня работы / 2 дня выходных
    const daysDiff = Math.floor((date.getTime() - workCycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysDiff % 4;
    return cycleDay === 0 || cycleDay === 1;
  };

  const fetchBookingsForDate = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('bookings')
      .select('booking_time, service_ids, status')
      .eq('booking_date', dateStr)
      .in('status', ['pending', 'confirmed']);

    if (data) {
      setExistingBookings(data);
    } else {
      setExistingBookings([]);
    }
  };

  const isTimeSlotAvailable = (timeStr: string): boolean => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotStart = hours * 60 + minutes;
    const totalDuration = getTotalDuration();
    const slotEnd = slotStart + totalDuration;

    for (const booking of existingBookings) {
      const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
      const bookingStart = bookingHours * 60 + bookingMinutes;
      
      const bookingDuration = booking.service_ids.reduce((total: number, serviceId: string) => {
        const service = services.find((s) => s.id === serviceId);
        return total + (service?.duration || 0);
      }, 0);
      
      const bookingEnd = bookingStart + bookingDuration;

      if (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      ) {
        return false;
      }
    }

    return true;
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

    return times.filter(isTimeSlotAvailable);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => 
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const removeService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service?.duration || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || selectedServices.length === 0 || !selectedDate || !selectedTime) {
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
          service_ids: selectedServices,
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
              <div className="space-y-4">
                <Label>Выберите услуги * (можно выбрать несколько)</Label>
                
                {selectedServices.length > 0 && (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">Выбранные услуги:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((serviceId) => {
                        const service = services.find((s) => s.id === serviceId);
                        return service ? (
                          <Badge key={serviceId} variant="secondary" className="gap-1">
                            {service.name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeService(serviceId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      <p>Общая стоимость: {getTotalPrice()} MDL</p>
                      <p>Общая продолжительность: {getTotalDuration()} мин</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(
                    services.reduce((acc, service) => {
                      if (!acc[service.category]) acc[service.category] = [];
                      acc[service.category].push(service);
                      return acc;
                    }, {} as Record<string, Service[]>)
                  ).map(([category, categoryServices]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold text-sm text-primary">{category}</h3>
                      {categoryServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <label
                            htmlFor={service.id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="font-medium">{service.name}</div>
                            <div className="text-muted-foreground">
                              {service.price} MDL · {service.duration} мин
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Выберите дату *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                    if (date) {
                      fetchBookingsForDate(date);
                    }
                  }}
                  disabled={(date) =>
                    startOfDay(date) < startOfDay(new Date()) ||
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
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {getAvailableTimes().map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
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
