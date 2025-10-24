import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Calendar, LogOut, User, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import logo from "@/assets/logo.jpg";

export const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setOpen(false);
  };

  const NavLinks = () => (
    <>
      <Link to="/" onClick={() => setOpen(false)}>
        <Button variant="ghost">Главная</Button>
      </Link>
      <Link to="/services" onClick={() => setOpen(false)}>
        <Button variant="ghost">Услуги</Button>
      </Link>
      <Link to="/booking" onClick={() => setOpen(false)}>
        <Button variant="ghost">
          <Calendar className="mr-2 h-4 w-4" />
          Запись онлайн
        </Button>
      </Link>
      {session ? (
        <>
          <Link to="/profile" onClick={() => setOpen(false)}>
            <Button variant="ghost">
              <User className="mr-2 h-4 w-4" />
              Мой профиль
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              <Button variant="secondary">Админ панель</Button>
            </Link>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </>
      ) : (
        <Link to="/auth" onClick={() => setOpen(false)}>
          <Button variant="default">Войти</Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Elena Nail Studio" className="h-12 w-12 rounded-full object-cover shadow-md" />
            <span className="text-xl font-semibold text-foreground">Natali</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
          </div>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {open ? <X /> : <Menu />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
