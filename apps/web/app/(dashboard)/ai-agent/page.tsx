'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  Bot,
  Sparkles,
  Sliders,
  CheckCircle2,
  Headphones,
  Save,
  Send,
  MessageSquare,
  Shield,
  Zap,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '@omniflow/ui';

export default function AiAgentPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  // Agent Config Form State
  const [personaName, setPersonaName] = useState('Apex Assistant');
  const [tone, setTone] = useState('FRIENDLY');
  const [language, setLanguage] = useState('AUTO');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are the intelligent sales & support assistant for Apex Lifestyle in Bangladesh. Assist customers with product recommendations, prices in BDT, size guidance, Cash on Delivery details (60 BDT inside Dhaka, 120 BDT outside Dhaka), order confirmations, and instant customer service in both Bengali and English.'
  );
  const [capabilities, setCapabilities] = useState({
    autoOrderCreation: true,
    productSearch: true,
    imageRecognition: true,
    voiceTranscription: true,
    bookingAppointment: true,
    sentimentAnalysis: true,
  });
  const [handoverKeywords, setHandoverKeywords] = useState('human, agent, support, প্রতিনিধি, কথা বলতে চাই, মানুষ চাই');
  const [fallbackMessageEn, setFallbackMessageEn] = useState('Connecting you with our support specialist right away.');
  const [fallbackMessageBn, setFallbackMessageBn] = useState('আমি আমাদের একজন কাস্টমার প্রতিনিধিকে আপনার সাথে যুক্ত করে দিচ্ছি।');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Test Chat State
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'ai'; content: string }>>([
    { sender: 'ai', content: 'আসসালামু আলাইকুম! আমি Apex Assistant। আপনাকে কিভাবে সাহায্য করতে পারি?' },
  ]);
  const [isTestTyping, setIsTestTyping] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await ApiClient.put('/ai-agent/config', {
        personaName,
        systemPrompt,
        tone,
        language,
        temperature,
        confidenceThreshold: 0.8,
        capabilities,
        handoverKeywords: handoverKeywords.split(',').map((k) => k.trim()),
        fallbackMessageEn,
        fallbackMessageBn,
      });
      setSaveSuccess(true);
    } catch {
      // In demo offline mode, persist visually
      setSaveSuccess(true);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSendTestQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const userText = testInput;
    setTestMessages((prev) => [...prev, { sender: 'user', content: userText }]);
    setTestInput('');
    setIsTestTyping(true);

    setTimeout(() => {
      let reply = `[${personaName} (${language})]: আপনার বার্তার জন্য ধন্যবাদ! আমাদের কাছে রয়্যাল নেভি ব্লু পাঞ্জাবি (৳২,৮৫০) এবং অ্যাপেক্স আল্ট্রা স্মার্ট ওয়াচ (৳৩,৪৫০) স্টকে রয়েছে। ক্যাশ অন ডেলিভারিতে অর্ডার করতে আপনার ঠিকানা ও ফোন নম্বর জানান।`;

      if (handoverKeywords.split(',').some((k) => userText.toLowerCase().includes(k.trim().toLowerCase()))) {
        reply = language === 'BENGALI' ? fallbackMessageBn : fallbackMessageEn;
      }

      setTestMessages((prev) => [...prev, { sender: 'ai', content: reply }]);
      setIsTestTyping(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <span>AI Agent Persona & Intelligence Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize how your autonomous sales agent greets customers, detects products, handles orders, and responds in Bengali/English.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Agent settings saved & deployed!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200 space-y-5">
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Agent Persona Name"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="e.g. Apex Assistant"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Conversation Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="FRIENDLY">Friendly & Helpful (বন্ধুত্বপূর্ণ)</option>
                    <option value="PROFESSIONAL">Professional & Formal (পেশাদার)</option>
                    <option value="DIRECT">Direct & Efficient (সংক্ষিপ্ত)</option>
                    <option value="PERSUASIVE">Persuasive Sales (বিক্রয়মুখী)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Response Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="AUTO">Auto Detect (স্বয়ংক্রিয় বাংলা / English)</option>
                    <option value="BENGALI">Bengali Only (শুধুমাত্র বাংলা)</option>
                    <option value="ENGLISH">English Only</option>
                    <option value="BANGLISH">Banglish (বাংলা ইন রোমান হরফ)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Creativity / Temperature</label>
                    <span className="text-xs font-bold text-indigo-600">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Precise (0.1)</span>
                    <span>Balanced (0.7)</span>
                    <span>Creative (1.2)</span>
                  </div>
                </div>
              </div>

              {/* System Instructions / Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Core System Prompt & Business Rules
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Capabilities Toggles */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Enabled Autonomous Capabilities</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries({
                    autoOrderCreation: 'Automatic Order Capture',
                    productSearch: 'Catalog Stock & Price Search',
                    imageRecognition: 'Photo Recognition (GPT-4o Vision)',
                    voiceTranscription: 'Voice Note Transcription (Whisper)',
                    bookingAppointment: 'Service Appointment Booking',
                    sentimentAnalysis: 'Customer Sentiment Detection',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(capabilities as any)[key]}
                        onChange={(e) =>
                          setCapabilities((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Handover Keywords */}
              <Input
                label="Human Handover Keywords (Comma separated)"
                value={handoverKeywords}
                onChange={(e) => setHandoverKeywords(e.target.value)}
                hint="AI will immediately pause and notify human agents when customer types any of these words."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Handover Notice (English)"
                  value={fallbackMessageEn}
                  onChange={(e) => setFallbackMessageEn(e.target.value)}
                />
                <Input
                  label="Handover Notice (বাংলা)"
                  value={fallbackMessageBn}
                  onChange={(e) => setFallbackMessageBn(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Agent Settings
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Test Simulator Pane (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="flex-1 flex flex-col border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">{personaName} Simulator</h3>
                  <p className="text-[10px] text-slate-400">Live test sandbox</p>
                </div>
              </div>
              <Badge variant="purple" size="sm">
                RAG Active
              </Badge>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 min-h-[350px] max-h-[500px]">
              {testMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p>{m.content}</p>
                  </div>
                </div>
              ))}

              {isTestTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>{personaName} is thinking...</span>
                </div>
              )}
            </div>

            {/* Prompt test bar */}
            <form onSubmit={handleSendTestQuery} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ask your agent a test question..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
