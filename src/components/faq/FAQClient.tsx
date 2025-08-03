"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';

const faqData = [
  {
    id: "1",
    category: "Appointments",
    question: "How do I book an appointment?",
    answer: "You can book an appointment through our website by visiting the 'Book Appointment' page, calling our helpline at +91 9876543210, or visiting our facility in person. Our online booking system is available 24/7 for your convenience."
  },
  {
    id: "2",
    category: "Appointments",
    question: "Can I cancel or reschedule my appointment?",
    answer: "Yes, you can cancel or reschedule your appointment up to 24 hours before your scheduled time. Please call our helpline or use our online portal to make changes. Cancellations made less than 24 hours in advance may be subject to a cancellation fee."
  },
  {
    id: "3",
    category: "Appointments",
    question: "What should I bring to my appointment?",
    answer: "Please bring a valid photo ID, your insurance card (if applicable), any current medications you're taking, and any relevant medical records or test results. Arrive 15 minutes early to complete any necessary paperwork."
  },
  {
    id: "4",
    category: "Services",
    question: "What medical services do you offer?",
    answer: "We offer a comprehensive range of medical services including general consultations, cardiology, dermatology, ophthalmology, physiotherapy, pediatrics, and emergency care. For a complete list of services, please visit our Services page."
  },
  {
    id: "5",
    category: "Services",
    question: "Do you provide emergency care?",
    answer: "Yes, we provide 24/7 emergency care services. Our emergency department is equipped with state-of-the-art facilities and staffed by experienced emergency medicine specialists. For life-threatening emergencies, please call emergency services immediately."
  },
  {
    id: "6",
    category: "Insurance",
    question: "Do you accept insurance?",
    answer: "Yes, we accept most major insurance plans. Please contact our billing department or check with your insurance provider to verify coverage. We also offer payment plans for uninsured patients and those with high deductibles."
  },
  {
    id: "7",
    category: "Insurance",
    question: "What if my insurance doesn't cover a service?",
    answer: "If your insurance doesn't cover a particular service, we'll provide you with an estimate of costs upfront. We offer flexible payment options and payment plans to help make healthcare affordable. Our financial counselors can work with you to find the best solution."
  },
  {
    id: "8",
    category: "General",
    question: "What are your operating hours?",
    answer: "Our regular hours are Monday-Friday: 8:00 AM - 6:00 PM, and Saturday-Sunday: 9:00 AM - 4:00 PM. Emergency services are available 24/7. Some specialized departments may have different hours - please check with the specific department."
  },
  {
    id: "9",
    category: "General",
    question: "Where are you located?",
    answer: "We are located in Colaba, Mumbai, 400001, India. Our facility is easily accessible by public transportation and we offer parking for patients and visitors. You can find detailed directions on our Contact page."
  },
  {
    id: "10",
    category: "General",
    question: "Do you offer telemedicine consultations?",
    answer: "Yes, we offer telemedicine consultations for many non-emergency conditions. This allows you to consult with our doctors from the comfort of your home. Please contact us to schedule a virtual appointment and receive instructions for the video consultation."
  },
  {
    id: "11",
    category: "Medical Records",
    question: "How can I access my medical records?",
    answer: "You can request access to your medical records by visiting our medical records department with a valid ID, or by submitting a written request. We also offer a patient portal where you can view test results, appointment history, and other medical information online."
  },
  {
    id: "12",
    category: "Medical Records",
    question: "Can I get copies of my test results?",
    answer: "Yes, you can obtain copies of your test results. Results are typically available through our patient portal within 24-48 hours. You can also request printed copies at the medical records department or have them sent to another healthcare provider with your authorization."
  },
  {
    id: "13",
    category: "Prescriptions",
    question: "How do I refill my prescriptions?",
    answer: "You can refill prescriptions by calling our pharmacy, using our online patient portal, or visiting the pharmacy in person. Make sure to request refills at least 48 hours before you run out of medication. Our pharmacy is open during regular business hours."
  },
  {
    id: "14",
    category: "Prescriptions",
    question: "Do you offer prescription delivery?",
    answer: "Yes, we offer prescription delivery services within a 10-mile radius of our facility. There may be a small delivery fee depending on your location and the urgency of delivery. Same-day delivery is available for urgent medications."
  },
  {
    id: "15",
    category: "Billing",
    question: "How will I receive my bill?",
    answer: "Bills are typically sent by mail within 2-3 weeks after your visit. You can also access your bills through our patient portal online. We offer electronic billing statements if you prefer to receive bills via email."
  },
  {
    id: "16",
    category: "Billing",
    question: "What payment methods do you accept?",
    answer: "We accept cash, credit cards (Visa, MasterCard, American Express), debit cards, checks, and online payments through our patient portal. We also offer payment plans for larger bills and work with various healthcare financing options."
  }
];

const categories = ["All", "Appointments", "Services", "Insurance", "General", "Medical Records", "Prescriptions", "Billing"];

export default function FAQClient() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about {APP_NAME} services, appointments, and policies.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No FAQs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {selectedCategory === 'All' ? 'All Questions' : `${selectedCategory} Questions`}
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full mt-1 flex-shrink-0">
                          {faq.category}
                        </span>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Section */}
      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8">
            <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our friendly team is here to help.
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Call us:</strong> +91 9876543210
              </p>
              <p className="text-sm">
                <strong>Email us:</strong> info@healthfirst.com
              </p>
              <p className="text-sm">
                <strong>Visit us:</strong> Colaba, Mumbai, 400001, India
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
