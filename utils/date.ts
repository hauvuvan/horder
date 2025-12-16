export const getDurationDays = (duration: string): number => {
  if (!duration) return 0;
  const num = parseInt(duration);
  if (isNaN(num)) return 0;
  if (duration.includes('tháng')) return num * 30;
  if (duration.includes('năm')) return num * 365;
  if (duration.includes('ngày')) return num;
  return 0; // Vĩnh viễn or unknown
};

export const calculateExpiry = (startDate: string, usageDuration: string): Date | null => {
  if (!usageDuration) return null;
  if (usageDuration.toLowerCase().includes('vĩnh viễn')) return null;

  const date = new Date(startDate);
  const amount = parseInt(usageDuration); 
  
  if (isNaN(amount)) return null;

  if (usageDuration.includes('tháng')) {
    date.setMonth(date.getMonth() + amount);
  } else if (usageDuration.includes('năm')) {
    date.setFullYear(date.getFullYear() + amount);
  }
  return date;
};
