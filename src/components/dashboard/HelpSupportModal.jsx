import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, ChevronUp, BookOpen, Video, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function HelpSupportModal({ isOpen, onClose }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!isOpen) return null;

  const faqItems = [
    {
      question: 'איך מבקשים החלפת משמרת?',
      answer: 'לחץ על המשמרת שלך בלוח השנה, בחר "בקש החלפה", ואז בחר אם אתה רוצה להחליף את כל המשמרת או חלק ממנה. לאחר מכן המשמרת תופיע בלוח כ"דרוש החלפה" וחברי היחידה יוכלו להציע לכסות אותה.'
    },
    {
      question: 'איך מציעים לכסות משמרת של מישהו?',
      answer: 'בלוח השנה, חפש משמרות המסומנות באדום (החלפה מלאה) או בצהוב (החלפה חלקית). לחץ על המשמרת ובחר "אני אחליף". תצטרך לבחור את המחלקה והתפקיד שלך, ולאחר מכן את השעות שאתה יכול לכסות.'
    },
    {
      question: 'מה זה "החלפה ראש בראש"?',
      answer: 'החלפה ראש בראש מאפשרת לך להציע למישהו להחליף משמרות - המשמרת שלו תעבור אליך והמשמרת שלך תעבור אליו. זה שימושי כאשר אתה רוצה משמרת מסוימת ומוכן לתת בתמורה את המשמרת שלך.'
    },
    {
      question: 'איך עורכים תפקיד במשמרת?',
      answer: 'רק מנהלים יכולים לערוך תפקידים. מנהלים יכולים ללחוץ על משמרת ולבחור "ערוך תפקיד" כדי לשנות את המחלקה או התפקיד המשובץ.'
    },
    {
      question: 'מה המשמעות של הצבעים בלוח?',
      answer: 'כחול = המשמרת שלך, אדום = דרוש כיסוי מלא, צהוב = דרוש כיסוי חלקי, ירוק = החלפה שאושרה, אפור = משמרות של אחרים. השורה הכתומה בכותרות מציינת את היום הנוכחי.'
    },
    {
      question: 'איך מוסיפים משמרת חדשה?',
      answer: 'רק מנהלים יכולים להוסיף משמרות חדשות. לחץ על תאריך ריק בלוח, בחר מחלקה ותפקיד, והמערכת תיצור את המשמרת. ניתן גם לעלות קובץ Excel עם כל המשמרות.'
    },
    {
      question: 'מה זה KPI Dashboard?',
      answer: 'ה-KPI Dashboard מציג במבט מהיר כמה בקשות החלפה יש, כמה משמרות בפער חלקי, כמה החלפות בוצעו ומה המשמרות העתידיות שלך. לחיצה על כל KPI תפתח את רשימת המשמרות הרלוונטיות.'
    },
    {
      question: 'איך משתמשים באינטגרציית WhatsApp?',
      answer: 'לאחר בקשת החלפה, תקבל כפתור לשתף את הבקשה בקבוצת WhatsApp. זה שולח הודעה עם פרטי המשמרת וקישור ישיר לאישור בלוח. המקבל יכול פשוט ללחוץ על הקישור ולאשר את הכיסוי.'
    }
  ];

  const quickLinks = [
    { icon: BookOpen, label: 'מדריך שימוש מלא', color: 'blue' },
    { icon: Video, label: 'סרטוני הדרכה', color: 'purple' },
    { icon: MessageCircle, label: 'צור קשר עם תמיכה', color: 'green' }
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">מרכז עזרה ותמיכה</h2>
                <p className="text-white/90 text-sm mt-1">כל מה שצריך לדעת על המערכת</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      p-4 rounded-xl border-2 hover:shadow-lg transition-all text-center
                      ${link.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : ''}
                      ${link.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : ''}
                      ${link.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100' : ''}
                    `}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      link.color === 'blue' ? 'text-blue-600' : ''
                    }${link.color === 'purple' ? 'text-purple-600' : ''}${
                      link.color === 'green' ? 'text-green-600' : ''
                    }`} />
                    <p className="text-sm font-medium text-gray-700">{link.label}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* FAQ Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">שאלות נפוצות (FAQ)</h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all"
                  >
                    <button
                      onClick={() => toggleExpand(index)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-800 text-right flex-1">
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

            {/* Tips Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span>
                טיפים מהירים
              </h4>
              <ul className="text-sm text-indigo-800 space-y-2">
                <li>• השתמש בסינון לפי מחלקה כדי למצוא משמרות רלוונטיות מהר יותר</li>
                <li>• שמור את קישור האפליקציה במועדפים בטלפון לגישה מהירה</li>
                <li>• הגדר התראות בקבוצת WhatsApp כדי לקבל עדכונים על בקשות חדשות</li>
                <li>• בדוק את ה-KPI Dashboard מדי יום לעדכונים</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex-shrink-0">
            <Button
              onClick={onClose}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
            >
              הבנתי, תודה!
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}