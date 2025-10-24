import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const categories = Array.from(new Set(services.map(s => s.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Наши услуги</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Профессиональный уход за вашими ногтями и красотой
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка услуг...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  {category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services
                    .filter((service) => service.category === category)
                    .map((service) => (
                      <Card
                        key={service.id}
                        className="hover:shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{service.duration} мин</span>
                            </div>
                            <Badge variant="secondary" className="text-base font-semibold">
                              {service.price} MDL
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/booking">
            <Button size="lg" className="shadow-[var(--shadow-soft)]">
              Записаться на услугу
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
