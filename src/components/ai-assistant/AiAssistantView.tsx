import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Copy,
  CheckCircle2,
  FileText,
  AlertCircle,
  Stethoscope,
  BookOpen,
  Trash2,
  Download,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { patientService } from '../../services/api';
import { Patient } from '../../types';
import { downloadText } from '../../utils/exportUtils';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  citations?: string[];
}

export const AiAssistantView: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { success, info } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_001');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text:
        language === 'uz'
          ? "Assalomu alaykum, hurmatli shifokor. Men TBDetect klinik qarorlarni qo'llab-quvvatlash bo'yicha sun'iy intellekt assistentiman. Bugun sizga ko'krak qafasi rentgenogrammasi tahlili, JSST DOTS davolash protokollari, GeneXpert natijalari talqini yoki yo'llanma hujjatlarini tayyorlashda qanday yordam bera olaman?"
          : language === 'ru'
          ? "Здравствуйте, доктор. Я клинический ассистент TBDetect по поддержке принятия врачебных решений. Чем я могу помочь вам сегодня: анализ рентгенограмм, схемы DOTS ВОЗ, интерпретация GeneXpert или подготовка направления?"
          : "Hello Doctor. I am the TBDetect Clinical Decision Support Assistant. How can I assist you with radiographic findings, WHO DOTS regimens, GeneXpert interpretation, or clinical referral drafting today?",
      timestamp: '10:00 AM',
      citations: [
        'WHO Consolidated Guidelines on Tuberculosis (Module 4: Treatment)',
        'WHO Guidelines for Chest Radiography in TB Screening',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    patientService.getPatients().then(setPatients);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const promptSuggestions =
    language === 'uz'
      ? [
          `${selectedPatient ? selectedPatient.firstName : 'Bemor'} uchun GeneXpert Ct < 16 ko'rsatkichi va davolash protokolini tushuntir`,
          `${selectedPatient ? selectedPatient.firstName + ' ' + selectedPatient.lastName : 'bemor'} uchun pulmonologiya statsionariga klinik yo'llanma matnini tayyorla`,
          "JSST bo'yicha tana vazni toifalariga mos 2HRZE / 4HR dori dozalari jadvali",
          "Ko'krak qafasi rentgenidagi yuqori bo'lak kavernasi differensial diagnostikasi",
          "DOTS terapiyasi dorilari qoldirilganda va qabul uzilganda nima qilish kerak?",
        ]
      : language === 'ru'
      ? [
          `Интерпретация GeneXpert Ct < 16 и протокол для ${selectedPatient ? selectedPatient.firstName : 'пациента'}`,
          `Подготовить клиническое направление в пульмонологию для ${selectedPatient ? selectedPatient.firstName + ' ' + selectedPatient.lastName : 'пациента'}`,
          'Схема дозирования 2HRZE / 4HR по весовым категориям ВОЗ',
          'Дифференциальный диагноз полостей распада в верхней доле легкого на рентгене',
          'Протокол действий при пропуске доз по стандарту DOTS',
        ]
      : [
          `Explain GeneXpert Ct < 16 & protocol for ${selectedPatient ? selectedPatient.firstName : 'Patient'}`,
          `Draft clinical pulmonology hospital referral for ${selectedPatient ? selectedPatient.firstName + ' ' + selectedPatient.lastName : 'current patient'}`,
          'Outline WHO standard 2HRZE / 4HR adult dosing schedule by body weight band',
          'Compare differential diagnoses for upper lobe cavitation on chest radiograph',
          'Management protocol for missed DOTS doses and treatment interruption',
        ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    setTimeout(() => {
      let aiResponseText = '';
      let citations: string[] = ['WHO Operational Handbook on Tuberculosis, 2024'];
      const ptName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Rustam Karimov';
      const ptId = selectedPatient ? selectedPatient.nationalId : 'UZ-AA8492011';
      const q = text.toLowerCase();

      const isUzbek = language === 'uz' || q.includes("o'zbek") || q.includes('tushuntir') || q.includes('yo\'llanma') || q.includes('bemor') || q.includes('dori') || q.includes('doza') || q.includes('nima');
      const isRussian = language === 'ru' || q.includes('направлени') || q.includes('дозировк') || q.includes('пропуск') || q.includes('пациент');

      if (q.includes('genexpert') || q.includes('ct') || q.includes('rifampitsin') || q.includes('рифампицин')) {
        if (isUzbek) {
          aiResponseText = `**${ptName} uchun GeneXpert MTB/RIF natijasi talqini (Ct < 16):**\n\n1. **Bakterial yuklama**: Balg'am namunasida *Mycobacterium tuberculosis* yuqori konsentratsiyasi aniqlandi (Ct < 16 kuchli bakteriya ajralishini ko'rsatadi).\n2. **Rifampitsinga sezgirlik**: RIF qarshiligi (mutatsiya) ANIQLANMADI. Bu dori-sezgir o'pka siliga to'liq mos keladi.\n3. **Klinik tavsiyalar**:\n   - Birinchi qatordagi standart 6 oylik kursni boshlash: **2HRZE** (2 oy intensiv Isoniazid, Rifampitsin, Pirazinamid, Etambutol) so'ng **4HR** (4 oy davom ettirish fazasi).\n   - Davolashning 1-kunidan avval jigar fermentlari (ALT, AST), kreatinin va siydik kislotasi tekshiruvini tayinlash.\n   - Oila a'zolari va yaqin aloqadagilarni faol silga skrining qilish hamda profilaktik terapiyani (TPT) ko'rib chiqish.`;
          citations = ["JSST 3-moduli: Silni erta aniqlashning tezkor diagnostikasi", "O'zbekiston Respublikasi Milliy sil klinik protokoli"];
        } else if (isRussian) {
          aiResponseText = `**Интерпретация GeneXpert MTB/RIF для ${ptName} (Ct < 16):**\n\n1. **Бактериальная нагрузка**: Высокая концентрация *Mycobacterium tuberculosis* в мокроте (Ct < 16 указывает на массивное бактериовыделение).\n2. **Чувствительность к рифампицину**: Мутации устойчивости к RIF НЕ обнаружены. Профиль лекарственно-чувствительного туберкулеза.\n3. **Клинические рекомендации**:\n   - Начать стандартный 6-месячный курс: **2HRZE** (2 месяца интенсивная фаза: изониазид, рифампицин, пиразинамид, этамбутол) с переходом на **4HR** (4 месяца фаза продолжения).\n   - Контроль биохимии крови (АЛТ, АСТ, билирубин, мочевая кислота) до начала терапии.\n   - Обследование семейного очага и контактных лиц.`;
          citations = ['Руководство ВОЗ по экспресс-диагностике ТБ', 'Национальный клинический протокол по туберкулезу'];
        } else {
          aiResponseText = `**GeneXpert MTB/RIF Interpretation for ${ptName} (Ct < 16):**\n\n1. **Bacterial Burden**: High *Mycobacterium tuberculosis* load detected in sputum specimen.\n2. **Rifampicin Susceptibility**: RIF Resistance NOT detected. Confirms drug-susceptible pulmonary tuberculosis profile.\n3. **Clinical Recommendation**:\n   - Initiate first-line 6-month regimen: **2HRZE** (2 months intensive daily Isoniazid, Rifampicin, Pyrazinamide, Ethambutol) followed by **4HR** (4 months continuation).\n   - Order baseline liver enzymes (ALT/AST), serum creatinine, and uric acid prior to Day 1.\n   - Screen household contacts for active TB and provide preventive therapy (TPT) if indicated.`;
          citations = ['WHO Module 3: Rapid Diagnostics for TB Detection', 'National TB Clinical Protocol Uzbekistan'];
        }
      } else if (q.includes('referral') || q.includes('yo\'llanma') || q.includes('yollanma') || q.includes('направлени')) {
        if (isUzbek) {
          aiResponseText = `**KLINIK YO'LLANMA (REFERRAL) HUJJATI**\n\n**Kimga:** Respublika Ixtisoslashtirilgan Pulmonologiya va Ftiziatriya Ilmiy-Amaliy Markazi\n**Yuboruvchi:** ${user?.name || 'Dr. Sarah Chen, MD'}\n**Sana:** ${new Date().toLocaleDateString()}\n\n**Bemor:** ${ptName} (${selectedPatient?.age || 48} yosh, ${selectedPatient?.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}, ID: ${ptId})\n\n**Yo'llanma sababi:**\nO'ng o'pka yuqori bo'lagida o'choqli destruktiv (kavernoz) o'zgarishlar, chuqur neyrotarmoq tahlilida AI xavf indeksi ${selectedPatient?.riskScore || 84}% va GeneXpert MTB musbat (Ct 14.8) natijasi bilan shoshilinch tekshiruv va davolash sxemasini tasdiqlash.\n\n**Klinik manzarasi:**\n- 4 haftadan buyon davom etayotgan yo'tal, balg'amda qon izlari, kechki subfebril isitma\n- Vazn kamayishi (so'nggi 1 oyda -4.2 kg), doimiy holsizlik\n- Hamroh xastaliklar: ${selectedPatient?.comorbidities?.join(', ') || 'Qandli diabet 2-tur'}\n\n**Ilova qilingan tahlillar:** Ko'krak qafasi to'g'ri rentgenogrammasi, balg'am mikroskopiyasi (BK 3+), GeneXpert MTB/RIF natijasi.\n\nBemorni shoshilinch konsultatsiya va statsionar davolashga qabul qilishingizni so'raymiz.`;
          citations = ["Sog'liqni saqlash vazirligi klinik yo'llanma standartlari"];
        } else if (isRussian) {
          aiResponseText = `**КЛИНИЧЕСКОЕ НАПРАВЛЕНИЕ**\n\n**Куда:** НИИ фтизиатрии и пульмонологии\n**Направивший врач:** ${user?.name || 'Dr. Sarah Chen, MD'}\n**Дата:** ${new Date().toLocaleDateString()}\n\n**Пациент:** ${ptName} (${selectedPatient?.age || 48} лет, ID: ${ptId})\n\n**Цель направления:**\nКонсультация и стационарное лечение по поводу инфильтративно-кавернозного туберкулеза верхней доли правого легкого. Индекс риска ИИ: ${selectedPatient?.riskScore || 84}%, GeneXpert MTB положителен (Ct 14.8).\n\n**Клиническая картина:**\n- Кашель с мокротой более 4 недель, кровохарканье, ночная потливость\n- Потеря массы тела, общая слабость\n- Сопутствующий статус: ${selectedPatient?.comorbidities?.join(', ') || 'Сахарный диабет 2 типа'}\n\nПрилагаются цифровой рентген, микроскопия мазка и молекулярный тест.`;
          citations = ['Стандарты медицинской эвакуации и направлений МЗ'];
        } else {
          aiResponseText = `**CLINICAL REFERRAL DOSSIER**\n\n**To:** Department of Pulmonology, Central TB Research Institute\n**From:** ${user?.name || 'Dr. Sarah Chen, MD'}\n**Date:** ${new Date().toLocaleDateString()}\n\n**Patient:** ${ptName} (${selectedPatient?.age || 48} yrs ${selectedPatient?.gender || 'MALE'}, National ID: ${ptId})\n\n**Reason for Referral:**\nUrgent evaluation of active cavitary pulmonary tuberculosis of the right upper lobe corroborated by Deep CNN radiograph analysis (AI Risk Index: ${selectedPatient?.riskScore || 84}%) and GeneXpert MTB positive (Ct 14.8).\n\n**Clinical Presentation:**\n- 4-week productive cough with hemoptysis and nocturnal pyrexia\n- Significant unintended weight loss and night sweats\n- Comorbidities: ${selectedPatient?.comorbidities?.join(', ') || 'Type 2 Diabetes'}\n\n**Attached Diagnostics:** Chest X-ray PA view, Sputum AFB smear 3+, GeneXpert cartridge result.\n\nThank you for urgent specialist evaluation.`;
          citations = ['Clinical Transfer & Referral Standards, MoH'];
        }
      } else if (q.includes('dosing') || q.includes('2hrze') || q.includes('doza') || q.includes('дозировк')) {
        if (isUzbek) {
          aiResponseText = `**JSST 2HRZE kombinatsiyalangan (FDC) dori vositalari vazn toifalari bo'yicha dozalari:**\n\n- **30–39 kg**: kuniga 2 tabletka (HRZE 75/150/400/275 mg)\n- **40–54 kg**: kuniga 3 tabletka\n- **55–70 kg**: kuniga 4 tabletka\n- **>70 kg**: kuniga 5 tabletka\n\n*Eslatma: Izoniazid fonida periferik neyropatiyani oldini olish uchun kuniga 25–50 mg Piridoksin (Vitamin B6) qabul qilish tavsiya etiladi (ayniqsa diabeti bor yoki toliqqan bemorlarda).*`;
          citations = ["JSST Dori-sezgir silni davolash bo'yicha ko'rsatmalari", "Milliy davolash protokollari"];
        } else if (isRussian) {
          aiResponseText = `**Стандартные дозировки комбинированных препаратов 2HRZE по весовым группам (ВОЗ):**\n\n- **30–39 кг**: 2 таблетки в сутки (HRZE 75/150/400/275 мг)\n- **40–54 кг**: 3 таблетки в сутки\n- **55–70 кг**: 4 таблетки в сутки\n- **>70 кг**: 5 таблеток в сутки\n\n*Рекомендация: Для профилактики периферической полинейропатии обязательно назначение пиридоксина (витамина B6) в дозе 25–50 мг/сутки.*`;
          citations = ['Руководство ВОЗ по лечению лекарственно-чувствительного ТБ'];
        } else {
          aiResponseText = `**WHO Standard 2HRZE Fixed-Dose Combination (FDC) Weight Bands:**\n\n- **30–39 kg**: 2 tablets daily (HRZE 75/150/400/275 mg)\n- **40–54 kg**: 3 tablets daily\n- **55–70 kg**: 4 tablets daily\n- **>70 kg**: 5 tablets daily\n\n*Note: Pyridoxine (Vitamin B6) 25–50 mg daily is strongly recommended to prevent peripheral neuropathy, especially in diabetic or malnourished patients.*`;
          citations = ['WHO Guidelines for Treatment of Drug-Susceptible TB', 'CDC Treatment Guidelines for Tuberculosis'];
        }
      } else if (q.includes('missed') || q.includes('interruption') || q.includes('qoldirilgan') || q.includes('uzilish') || q.includes('пропуск')) {
        if (isUzbek) {
          aiResponseText = `**DOTS davolanish kursi uzilganda taktik qoidalar (JSST protokoli):**\n\n1. **Intensiv fazada < 14 kunlik uzilish**: Davolash darhol davom ettiriladi va rejadagi barcha dozalar to'liq ichilguncha intensiv faza muddati uzaytiriladi.\n2. **Intensiv fazada ≥ 14 kunlik uzilish**: Balg'am mikroskopiyasi va GeneXpert qayta o'tkaziladi. Agar musbat chiqsa, to'liq 2HRZE kursi 1-kundan boshlab yangidan boshlanadi.\n3. **Davom ettirish fazasida uzilish (< 80% doza ichilgan bo'lsa)**: Agar uzilish 2 oydan kam bo'lsa, davom ettiriladi; 2 oy va undan ko'p bo'lsa, to'liq kurs boshidan boshlanadi.\n\n*Amal: Bemor bilan tushuntirish suhbati o'tkazish va elektron tabletkalar qutisi (video-DOTS) orqali monitoringni kuchaytirish.*`;
          citations = ["JSST Davolash uzilishlari protokoli, 4-modul"];
        } else if (isRussian) {
          aiResponseText = `**Тактика при перерыве в приеме препаратов DOTS (Протокол ВОЗ):**\n\n1. **Перерыв < 14 дней в интенсивной фазе**: Немедленно возобновить прием, продлив интенсивную фазу на количество пропущенных дней.\n2. **Перерыв ≥ 14 дней в интенсивной фазе**: Повторить микроскопию мокроты и GeneXpert. При положительном результате курс 2HRZE начинается заново с 1-го дня.\n3. **Перерыв в фазе продолжения**: Если перерыв менее 2 месяцев — возобновить фазу продолжения; если более 2 месяцев — повторный старт терапии.\n\n*Рекомендация: Провести беседу по приверженности лечению и подключить видео-DOTS контроль.*`;
          citations = ['Протоколы ВОЗ по ведению перерывов в лечении (Модуль 4)'];
        } else {
          aiResponseText = `**Management of Treatment Interruption (WHO Protocol):**\n\n1. **< 14 Days Interruption (Intensive Phase)**: Resume treatment immediately and prolong the intensive phase until all planned doses are completed.\n2. **≥ 14 Days Interruption (Intensive Phase)**: Perform repeat sputum smear / GeneXpert. If positive, restart the full 2HRZE intensive phase from Day 1.\n3. **Continuation Phase Interruption (< 80% Doses Completed)**: Resume continuation phase if lapse is < 2 months; restart full regimen if lapse is ≥ 2 months.\n\n*Action: Conduct DOTS adherence counseling and verify digital pillbox telemetry.*`;
          citations = ['WHO Treatment Interruption Protocols, Module 4'];
        }
      } else {
        if (isUzbek) {
          aiResponseText = `JSST va xalqaro pulmonologiya qo'llanmalariga ko'ra, raqamli ko'krak qafasi rentgenogrammasi, yo'tal akustikasi tahlili va molekulyar testlarni (GeneXpert) birlashtirgan multimodal AI skriningi erta silni aniqlashda 98% dan ortiq sezgirlikni ta'minlaydi.\n\nHozirda faol bemor: **${ptName}** (AI xavf ko'rsatkichi: ${selectedPatient?.riskScore || 84}%). Qanday klinik ma'lumot yoki yo'llanma kerak bo'lsa, so'rashingiz mumkin.`;
        } else if (isRussian) {
          aiResponseText = `Согласно клиническим руководствам ВОЗ, мультимодальный скрининг (цифровой рентген, акустический анализ кашля и GeneXpert) обеспечивает чувствительность свыше 98% для раннего выявления активного туберкулеза.\n\nЗагружен контекст пациента: **${ptName}** (Индекс риска ИИ: ${selectedPatient?.riskScore || 84}%). Чем я могу помочь?`;
        } else {
          aiResponseText = `Based on WHO and international pulmonology guidelines, comprehensive multi-modal screening combining digital chest radiography, acoustic cough classification, and molecular cartridge assays (GeneXpert) provides >98% sensitivity for early active pulmonary TB detection.\n\nCurrent context loaded for **${ptName}** (Risk Index: ${selectedPatient?.riskScore || 84}%). How can I assist further?`;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 700);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Message copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Clear clinical conversation history?')) {
      setMessages([
        {
          id: '1',
          sender: 'ai',
          text: 'Conversation cleared. How can I assist you with clinical guidelines, referrals, or drug dosing?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      info('Chat history reset.');
    }
  };

  const handleExportChat = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n`)
      .join('\n----------------------------------------\n\n');

    downloadText(transcript, `TBDetect_Clinical_Assistant_Transcript_${new Date().toISOString().slice(0, 10)}.txt`);
    success('Chat transcript exported.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.aiAssistant.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
              Pulmonology Knowledge Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.aiAssistant.subtitle}</p>
        </div>

        {/* Patient Context & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Patient Context:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none max-w-[200px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.riskLevel})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportChat}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <MedicalDisclaimer variant="compact" />

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[620px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {!isUser && msg.citations && (
                    <div className="pt-2 mt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <BookOpen className="w-3 h-3 text-violet-600" />
                        <span>Clinical Guideline Grounding:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                        {msg.citations.map((cite, i) => (
                          <li key={i}>{cite}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-slate-700 font-medium ml-4 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 font-bold text-xs">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-2 font-bold text-violet-700">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Consulting WHO TB Guideline Knowledge Graph...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Bar */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {promptSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sug)}
              className="px-3 py-1 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-xl text-slate-700 text-xs whitespace-nowrap transition-colors shadow-2xs font-medium"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a clinical question, request a referral letter, or drug dosing protocol..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
