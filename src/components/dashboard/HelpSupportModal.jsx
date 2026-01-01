import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, ChevronUp, BookOpen, Video, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function HelpSupportModal({ isOpen, onClose }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  const faqItems = [
    {
      question: 'איך פותחים בקשת כיסוי חדשה?',
      answer: 'לחצו על המשמרת הרצויה בלוח, בחרו "בקש החלפה" ומלאו את שעות הכיסוי הנדרשות. המשמרת תסומן אוטומטית כדרושה כיסוי והצוות יקבל התראה.'
    },
    {
      question: 'איך מאשרים הצעת כיסוי שהתקבלה?',
      answer: 'כנסו למשמרת המסומנת, בדקו את פרטי ההצעה ולחצו על "אשר כיסוי". המערכת תעדכן את לוח המשמרות ותשלח התראה למאשר ולמציע.'
    },
    {
      question: 'איך מסננים משמרות לפי מחלקה ותפקיד?',
      answer: 'בחלק העליון של לוח השנה יש מסננים למחלקה ולתפקיד. בחרו את הערכים הרצויים כדי לראות רק משמרות רלוונטיות אליכם ולקבל רשימה ממוקדת.'
    },
    {
      question: 'איך מתאימים תפקידים או שעות אחרי יצירת משמרת?',
      answer: 'מנהלים יכולים לפתוח את המשמרת הרצויה, לבחור "ערוך משמרת" ולעדכן מחלקה, תפקיד או שעות. השינויים מתעדכנים לכל הצוות בזמן אמת.'
    },
    {
      question: 'מה המשמעות של הצבעים בלוח?',
      answer: 'כחול = המשמרת שלך, אדום = דרוש כיסוי מלא, צהוב = דרוש כיסוי חלקי, ירוק = כיסוי שאושר, אפור = משמרות של אחרים. פס כתום מסמן את היום הנוכחי.'
    },
    {
      question: 'איך מפעילים התראות וואטסאפ לעדכונים?',
      answer: 'אחרי פתיחת בקשה או אישור כיסוי, לחצו על כפתור השיתוף בוואטסאפ כדי לשלוח עדכון מיידי לצוות. ניתן להעתיק את הקישור או לשלוח ישירות לקבוצת היחידה.'
    },
    {
      question: 'איך רואים ביצועים וסטטוס כיסוי?',
      answer: 'בלוח הבקרה (KPI Dashboard) מוצג מספר הבקשות הפתוחות, פערי הכיסוי והאישורים האחרונים. לחיצה על מדד פותחת את המשמרות הרלוונטיות לפעולה מהירה.'
    }
  ];

  const quickLinks = [
    {
      icon: BookOpen,
      label: 'מדריך שימוש מלא',
      color: 'blue',
      onClick: () => setInfoMessage('📘 בקרוב: מדריך שימוש מלא עם תסריטי עבודה לדסק ולמנהלים!')
    },
    {
      icon: Video,
      label: 'סרטוני הדרכה',
      color: 'purple',
      onClick: () => setInfoMessage('🎬 בקרוב: סרטוני וידאו קצרים עם הדגמות חיות של תהליכי כיסוי משמרות!')
    },
    {
      icon: MessageCircle,
      label: 'תמיכה טכנית',
      color: 'green',
      onClick: () => window.open('https://wa.me/972536221840', '_blank')
    }
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          // שיניתי ל-max-w-2xl וסידרתי גובה למובייל
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 md:p-6 text-white flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 md:p-3 bg-white/20 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">מרכז עזרה ותמיכה</h2>
                <p className="text-white/90 text-xs md:text-sm mt-1">כל מה שצריך לדעת על המערכת</p>
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6">

            {/* Quick Links - Responsive Grid */}
            {/* שינוי חשוב: 1 עמודה במובייל, 3 במחשב */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={link.onClick}
                    className={`
                      flex md:block items-center gap-3 md:gap-0 p-4 rounded-xl border-2 hover:shadow-lg transition-all text-right md:text-center
                      ${link.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : ''}
                      ${link.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : ''}
                      ${link.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100' : ''}
                    `}
                  >
                    <Icon className={`w-6 h-6 md:mx-auto md:mb-2 flex-shrink-0 ${
                      link.color === 'blue' ? 'text-blue-600' : ''
                    }${link.color === 'purple' ? 'text-purple-600' : ''}${
                      link.color === 'green' ? 'text-green-600' : ''
                    }`} />
                    <p className="text-sm font-medium text-gray-700">{link.label}</p>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {infoMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm"
                >
                  {infoMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAQ Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                שאלות נפוצות
              </h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-all"
                  >
                    <button
                      onClick={() => toggleExpand(index)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-right"
                    >
                      <span className="font-semibold text-gray-800 text-sm md:text-base leading-tight ml-3">
                        {item.question}
                      </span>
                      {expandedIndex === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 md:p-6 pt-0 flex-shrink-0 bg-white border-t border-gray-100 mt-auto pt-4">
            <Button
              onClick={onClose}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md"
            >
              הבנתי, תודה!
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

