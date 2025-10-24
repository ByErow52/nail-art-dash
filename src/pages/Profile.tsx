import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
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

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  services: {
    name: string;
    price: number;
    duration: number;
  };
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
        fetchBookings(session.user.id);
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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const fetchBookings = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        notes,
        services (name, price, duration)
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (data) {
      setBookings(data as any);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Профиль обновлен!",
        description: "Ваши данные успешно сохранены",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!deleteBookingId) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', deleteBookingId);

      if (error) throw error;

      setBookings(bookings.filter((b) => b.id !== deleteBookingId));
      toast({
        title: "Запись отменена",
        description: "Ваша запись была успешно удалена",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка отмены",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Мой профиль</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Личные данные</TabsTrigger>
            <TabsTrigger value="bookings">Мои записи</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle>Редактировать профиль</CardTitle>
              </CardHeader>
              <CardContent>
                {profile && (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          defaultValue={profile.first_name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          defaultValue={profile.last_name}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={profile.phone}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Сохранение..." : "Сохранить изменения"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      У вас пока нет записей
                    </p>
                    <Button onClick={() => navigate("/booking")}>
                      Создать запись
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="shadow-[var(--shadow-soft)]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {booking.services.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.services.price} MDL · {booking.services.duration} мин
                            </p>
                          </div>

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

                          <div>{getStatusBadge(booking.status)}</div>
                        </div>

                        {booking.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteBookingId(booking.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteBookingId} onOpenChange={() => setDeleteBookingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите отменить эту запись? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Назад</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelBooking}>
                Отменить запись
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Profile;
