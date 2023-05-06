import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import moment from 'moment';
import ClassDetails from './ClassDetails';
import './CalendarStyles.css';

const Calendar = ({ classes }) => {
  const [open, setOpen] = useState(false);
  const [classData, setClassData] = useState({});

  const handleEventClick = (info) => {
    setClassData(info.event.extendedProps);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getClassColor = (classId) => {
    const colors = ['#F79C1E', '#1E90F7', '#F71E45', '#45F71E', '#1EF7DC'];
    return colors[classId % colors.length];
  };  

  const getEventDates = (occurrence) => {
    const start = moment().startOf('week').day(occurrence.day).hour(moment(occurrence.time, 'HH:mm').hour()).minute(moment(occurrence.time, 'HH:mm').minute());
    const end = start.clone().add(1, 'hours');
    return { start: start.toDate(), end: end.toDate() };
  };

  const events = classes.flatMap((classItem) => {
    return classItem.occurrences.map((occurrence) => {
      const { start, end } = getEventDates(occurrence);
      return {
        title: classItem.name, // Only display the class name
        start,
        end,
        id: classItem.id,
        allDay: false,
        occurrences: classItem.occurrences,
        current_capacity: classItem.current_capacity,
        max_capacity: classItem.max_capacity,
        color: getClassColor(classItem.id), // Assign the color based on the class id
      };
    });
  });
  

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: 'today',
          month: 'month',
          week: 'week',
          day: 'day',
        }}
        weekends={true}
        events={events}
        eventClick={handleEventClick}
      />
      <ClassDetails
        open={open}
        classData={classData}
        onClose={handleClose}
        onClassUpdated={handleClose}
      />
    </>
  );
};

export default Calendar;
