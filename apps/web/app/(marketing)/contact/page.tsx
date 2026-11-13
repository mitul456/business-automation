'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Bot,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button, Input, Textarea, Card, Badge } from '@omniflow/ui';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    monthlyOrders: '100-500',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="space-y-20 py-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <Badge variant="purple" size="md">
          Get in Touch
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Let’s Talk About Scaling Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Social Commerce
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Whether you need a custom enterprise integration, volume pricing, or a live onboarding walkthrough, our product specialists are ready.
        </p>
      </section>

      {/* Main Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Direct Contact Information</h3>
              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Headquarters Office</p>
                    <p>Level 8, Crystal Tower, Gulshan-1</p>
                    <p>Dhaka 1212, Bangladesh</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Merchant Hotline & WhatsApp</p>
                    <p>+880 1800-OMNIFLOW (Toll Free)</p>
                    <p className="text-slate-400">Available Mon - Sat, 9:00 AM - 8:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Email Inquiries</p>
                    <p>sales@omniflow.ai</p>
                    <p>support@omniflow.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Response SLA</p>
                    <p>Average response time &lt; 15 minutes during business hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Simulator Card */}
            <div className="rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 p-6 text-white space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Fast-Track Demo
              </div>
              <h4 className="font-bold text-base">Want to see the AI agent in action right now?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                You do not need to wait for a call. Test our multimodal live conversational simulator directly on the home page.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="p-8 sm:p-10 border-slate-200/90 shadow-lg">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Thank you for reaching out, <strong>{formData.name}</strong>. An OmniFlow solutions specialist will contact you via phone/WhatsApp within 15 minutes.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        businessName: '',
                        monthlyOrders: '100-500',
                        message: '',
                      });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900">Send an Inquiry</h3>
                  <p className="text-xs text-slate-500">
                    Fill out the form below and we will get back to you promptly.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name *"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      label="Email Address *"
                      type="email"
                      required
                      placeholder="tanvir@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone / WhatsApp Number *"
                      required
                      placeholder="+880 1700-000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                      label="Business / Brand Name *"
                      required
                      placeholder="Apex Clothing Ltd."
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Average Monthly Social Orders
                    </label>
                    <select
                      value={formData.monthlyOrders}
                      onChange={(e) => setFormData({ ...formData, monthlyOrders: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="Under 100">Under 100 orders / month</option>
                      <option value="100-500">100 - 500 orders / month</option>
                      <option value="500-2,000">500 - 2,000 orders / month</option>
                      <option value="2,000+">2,000+ high-volume enterprise orders</option>
                    </select>
                  </div>

                  <Textarea
                    label="How can we help your business? *"
                    required
                    rows={4}
                    placeholder="Tell us about your channels, team size, or courier/payment integration requirements..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={loading}
                    className="w-full font-bold shadow-md shadow-indigo-300"
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Request
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
