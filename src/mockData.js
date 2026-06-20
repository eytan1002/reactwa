// Mock chat data - replace with real API calls later
export const isMyMessage = (message) => message.sender === 'אני';

export const mockChats = [
  {
    id: 1,
    name: 'אמא',
    avatar: '👩',
    lastMessage: 'שלום בן! איך אתה?',
    lastMessageTime: '14:30',
    messages: [
      { id: 1, sender: 'אמא', text: 'שלום בן! איך אתה?', timestamp: '14:30', isOwn: false },
      { id: 2, sender: 'אני', text: 'היי אמא! הכל בסדר', timestamp: '14:31', isOwn: true },
      { id: 3, sender: 'אמא', text: 'תאכול משהו?', timestamp: '14:32', isOwn: false },
      { id: 4, sender: 'אני', text: 'כן, זה בא בדרך', timestamp: '14:33', isOwn: true },
    ]
  },
  {
    id: 2,
    name: 'חברים',
    avatar: '👥',
    lastMessage: 'דוד: איזה סרט ראיתם?',
    lastMessageTime: '13:15',
    messages: [
      { id: 1, sender: 'דוד', text: 'שלום חבריםים!', timestamp: '12:00', isOwn: false },
      { id: 2, sender: 'דנה', text: 'היי! מה חדש?', timestamp: '12:05', isOwn: false },
      { id: 3, sender: 'אני', text: 'היי לכולם!', timestamp: '12:10', isOwn: true },
      { id: 4, sender: 'דוד', text: 'איזה סרט ראיתם?', timestamp: '13:15', isOwn: false },
      { id: 5, sender: 'דנה', text: 'The Matrix', timestamp: '13:20', isOwn: false },
    ]
  },
  {
    id: 3,
    name: 'עבודה',
    avatar: '💼',
    lastMessage: 'מנהל: הפרויקט מתקדם',
    lastMessageTime: '11:45',
    messages: [
      { id: 1, sender: 'מנהל', text: 'היי, עדכון על הפרויקט?', timestamp: '10:00', isOwn: false },
      { id: 2, sender: 'אני', text: 'הכל טוב, סגרתי את המשימות', timestamp: '10:30', isOwn: true },
      { id: 3, sender: 'מנהל', text: 'מעולה, הפרויקט מתקדם', timestamp: '11:45', isOwn: false },
    ]
  },
  {
    id: 4,
    name: 'דן',
    avatar: '👨',
    lastMessage: 'כן, בסדר!',
    lastMessageTime: '09:20',
    messages: [
      { id: 1, sender: 'דן', text: 'היי, הכל בסדר?', timestamp: '08:00', isOwn: false },
      { id: 2, sender: 'אני', text: 'כן, בסדר!', timestamp: '09:20', isOwn: true },
    ]
  },
];
