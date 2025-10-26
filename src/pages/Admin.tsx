import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Phone, User, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import ScheduleManager from "@/components/ScheduleManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  service_ids: string[];
}

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminAndFetch(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAndFetch = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
      fetchBookings();
    } else {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    
    // Fetch services
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, price, duration');
    
    if (servicesData) {
      setServices(servicesData);
    }

    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, phone');
    
    if (profilesData) {
      setProfiles(profilesData);
    }

    // Fetch bookings
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_date,
        booking_time,
        status,
        notes,
        service_ids
      `)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (data) {
      setBookings(data as any);
    }
    setLoading(false);
  };

  const getServicesByIds = (serviceIds: string[]) => {
    return services.filter((s) => serviceIds.includes(s.id));
  };

  const getTotalPrice = (serviceIds: string[]) => {
    return getServicesByIds(serviceIds).reduce((total, s) => total + s.price, 0);
  };

  const getTotalDuration = (serviceIds: string[]) => {
    return getServicesByIds(serviceIds).reduce((total, s) => total + s.duration, 0);
  };

  const getProfileByUserId = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      toast({
        title: "Статус обновлен",
        description: "Статус записи успешно изменен",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteBookingId) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', deleteBookingId);

      if (error) throw error;

      setBookings(bookings.filter((b) => b.id !== deleteBookingId));
      toast({
        title: "Запись удалена",
        description: "Запись успешно удалена из системы",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteBookingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "Ожидание", variant: "secondary" },
      confirmed: { label: "Подтверждено", variant: "default" },
      cancelled: { label: "Отменено", variant: "destructive" },
    };

    const { label, variant } = statusMap[status] || statusMap.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filterBookingsByStatus = (status: string) => {
    return bookings.filter((b) => b.status === status);
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Панель администратора</h1>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="bookings">Записи</TabsTrigger>
            <TabsTrigger value="schedule">Управление расписанием</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Все ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Ожидают ({filterBookingsByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs sm:text-sm">
              Подтвержд. ({filterBookingsByStatus('confirmed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
              Отменены ({filterBookingsByStatus('cancelled').length})
            </TabsTrigger>
          </TabsList>

          {['all', 'pending', 'confirmed', 'cancelled'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-4">
                {(tab === 'all' ? bookings : filterBookingsByStatus(tab)).length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">Записей не найдено</p>
                    </CardContent>
                  </Card>
                ) : (
                  (tab === 'all' ? bookings : filterBookingsByStatus(tab)).map((booking) => {
                    const profile = getProfileByUserId(booking.user_id);
                    return (
                      <Card key={booking.id} className="shadow-[var(--shadow-soft)]">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2">Услуги:</h3>
                                  <div className="space-y-1">
                                    {getServicesByIds(booking.service_ids).map((service) => (
                                      <div key={service.id} className="text-sm">
                                        • {service.name} - {service.price} MDL ({service.duration} мин)
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground font-semibold mt-2">
                                    Итого: {getTotalPrice(booking.service_ids)} MDL · {getTotalDuration(booking.service_ids)} мин
                                  </p>
                                </div>
                                {getStatusBadge(booking.status)}
                              </div>

                              {profile && (
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>
                                      {profile.first_name} {profile.last_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <a href={`tel:${profile.phone}`} className="hover:underline">
                                      {profile.phone}
                                    </a>
                                  </div>
                                </div>
                              )}

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>
                                  {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: ru })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{booking.booking_time}</span>
                              </div>
                            </div>

                            {booking.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                Примечание: {booking.notes}
                              </p>
                            )}

                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                >
                                  Подтвердить
                                </Button>
                              )}
                              {booking.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                >
                                  Отменить
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteBookingId(booking.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleManager />
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteBookingId} onOpenChange={() => setDeleteBookingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBooking}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Admin;
