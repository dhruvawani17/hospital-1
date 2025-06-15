
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, BriefcaseMedical, CalendarDays, Users, Award, Stethoscope } from 'lucide-react';
import { SERVICES_DATA, APP_NAME, DOCTORS_DATA } from '@/lib/constants';

export default function HomePage() {
  const featuredServices = SERVICES_DATA.slice(0, 3);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary/8 via-background to-background">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in"
            style={{ animationDelay: "0.2s" }}>
            Welcome to <span className="text-primary">{APP_NAME}</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl animate-fade-in"
            style={{ animationDelay: "0.4s" }}>
            Your trusted partner in health and wellness. We provide comprehensive medical services with a personal touch.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "0.6s" }}>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/book-appointment">Book an Appointment</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-headline font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Experienced Doctors", description: "Our team of certified professionals is dedicated to your well-being." },
              { icon: BriefcaseMedical, title: "Comprehensive Care", description: "From routine check-ups to specialized treatments, we've got you covered." },
              { icon: CalendarDays, title: "Easy Scheduling", description: "Book appointments online hassle-free with our smart scheduling system." },
            ].map((item, index) => (
              <Card key={item.title} className="text-center animate-slide-in-up hover:shadow-lg transition-shadow duration-300 ease-in-out" style={{animationDelay: `${0.2 * (index + 1)}s`}}>
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="font-headline">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="w-full py-16 md:py-24 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-headline font-bold text-center mb-12">Our Core Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <Card key={service.id} className="overflow-hidden animate-slide-in-up hover:shadow-xl transition-shadow duration-300 ease-in-out" style={{animationDelay: `${0.2 * (index + 1)}s`}}>
                <Image
                  src={service.image}
                  alt={service.name}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={service.dataAiHint}
                />
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    {service.icon && <service.icon className="h-6 w-6 text-primary" />}
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">{service.description}</CardDescription>
                  <Button asChild variant="link" className="px-0 mt-4 text-accent">
                    <Link href={`/services#${service.id}`}>Learn More <CheckCircle className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline">
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Meet Our Doctors Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-headline font-bold text-center mb-4">Meet Our Experienced Doctors</h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground text-center mb-12">
            Our dedicated team of medical professionals is here to provide you with exceptional care.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {DOCTORS_DATA.map((doctor, index) => (
              <Card key={doctor.id} className="overflow-hidden animate-slide-in-up flex flex-col hover:shadow-xl transition-shadow duration-300 ease-in-out" style={{animationDelay: `${0.15 * (index + 1)}s`}}>
                <div className="relative w-full h-64 sm:h-72">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top"
                    data-ai-hint={doctor.dataAiHint || "doctor portrait"}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{doctor.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-primary font-medium">
                    {doctor.specialtyIcon ? <doctor.specialtyIcon className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                    {doctor.specialty}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Award className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-card-foreground">Qualifications</h4>
                      <p className="text-muted-foreground">{doctor.qualifications}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BriefcaseMedical className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-card-foreground">Experience</h4>
                      <p className="text-muted-foreground">{doctor.experience}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-16 md:py-24 bg-secondary/50">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-headline font-bold mb-6">Ready to Prioritize Your Health?</h2>
          <p className="max-w-xl mx-auto text-muted-foreground mb-8">
            Don't wait to take care of yourself. Our team is here to support you on your journey to better health.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/book-appointment">Schedule Your Visit Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
