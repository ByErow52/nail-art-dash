import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Phone, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpg";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Добро пожаловать в студию{" "}
              <span className="text-primary">Natali</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Профессиональный маникюр, педикюр и эстетические услуги в самом сердце Кишинёва
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking">
                <Button size="lg" className="shadow-[var(--shadow-soft)]">
                  <Calendar className="mr-2 h-5 w-5" />
                  Записаться онлайн
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Наши услуги
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
              <img
                src={logo}
                alt="Elena Nail Studio"
                className="relative w-80 h-80 rounded-full object-cover shadow-2xl border-4 border-background"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-card/50 backdrop-blur">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 inline-block p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Качество</h3>
              <p className="text-muted-foreground">
                Используем только профессиональные материалы премиум-класса
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 inline-block p-3 bg-primary/10 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Удобный график</h3>
              <p className="text-muted-foreground">
                Работаем 09:00-20:00 (пн-сб), 09:00-18:00 (вс)
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
            <CardContent className="pt-6">
              <div className="mb-4 inline-block p-3 bg-primary/10 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Онлайн запись</h3>
              <p className="text-muted-foreground">
                Быстрая и удобная запись через наш сайт 24/7
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Как нас найти</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Strada Ion Creangă 45, Chișinău</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              <a href="tel:068925696" className="hover:text-primary transition-colors">
                068925696
              </a>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/ciPXzAGjQFNxbmq86"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              <MapPin className="mr-2 h-5 w-5" />
              Открыть на карте
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
