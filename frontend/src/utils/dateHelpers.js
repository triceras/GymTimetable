export const getEventDates = (occurrence) => {
    const days = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 0,
    };
  
    const now = new Date();
    const today = now.getDay();
    const targetDay = days[occurrence.day];
    const daysToTarget = (targetDay - today + 7) % 7;
    const targetDate = new Date(now.setDate(now.getDate() + daysToTarget));
  
    const [hours, minutes] = occurrence.time.split(":");
    targetDate.setHours(parseInt(hours, 10));
    targetDate.setMinutes(parseInt(minutes, 10));
  
    const start = new Date(targetDate);
    const end = new Date(targetDate);
    end.setHours(targetDate.getHours() + 1); // Assuming each class is 1 hour long
  
    return { start, end };
  };
  