import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import moment from 'moment';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import './CalendarStyles.css';

const Calendar = ({ classes, selectedClass }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  //const formattedTime = moment(occurrence.time, 'HH:mm').format('HH:mm:ss');

  useEffect(() => {
    console.log('Classes prop in Calendar:', classes);
    if (classes && classes.length > 0) {
      const newEvents = generateEvents(classes, selectedClass);
      console.log('New events:', newEvents);
      setEvents(newEvents);
    }
  }, [classes, selectedClass]);

  const getClassColor = (classId) => {
    const colors = ['#F79C1E', '#1E90F7', '#F71E45', '#45F71E', '#1EF7DC'];
    return colors[classId % colors.length];
  };

  const getEventDates = (classItem, occurrence) => {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(occurrence.day.toLowerCase());

    // Format the time here if needed
    const formattedTime = moment(occurrence.time, 'HH:mm').format('HH:mm:ss');

    const startTime = moment(formattedTime, 'HH:mm:ss');
    const start = moment().startOf('week').add(dayIndex, 'days').set({
      hour: startTime.hours(),
      minute: startTime.minutes(),
      second: startTime.seconds()
    });
    const end = start.clone().add(1, 'hours');

    return {
      start: start.toDate(),
      end: end.toDate(),
      id: classItem.id,
      title: `${occurrence.time}\n${classItem.instructor || 'No instructor'}\n${classItem.name}`,
      occurrenceId: occurrence.id,
      occurrence: {...occurrence, class_name: classItem.name },
      color: getClassColor(classItem.id),
      extendedProps: {
        occurrence,
        classItem: {...classItem, name: classItem.name },
      },
    };
  };

  const generateEvents = (classes, selectedClass) => {
    return classes.flatMap((classItem) => {
      if (selectedClass && classItem.name !== selectedClass) {
        return [];
      }
      return classItem.occurrences.map((occurrence) => {
        const { start, end } = getEventDates(classItem, occurrence);
        return {
          title: `${occurrence.time}\n${classItem.instructor || 'No instructor'}\n${classItem.name}`,
          start,
          end,
          id: occurrence.id,
          allDay: false,
          extendedProps: {
            occurrence,
            classItem,
          },
          color: getClassColor(classItem.id),
        };
      });
    });
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const { occurrence, classItem } = event.extendedProps;
    setSelectedEvent({
      title: event.title,
      start: event.start,
      occurrence: occurrence,
      classItem: classItem,
      currentCapacity: occurrence.current_capacity,
      maxCapacity: occurrence.max_capacity
    });
    setIsDialogOpen(true);
  };

  const handleScheduleClass = async () => {
    if (selectedEvent) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not authenticated. Please log in again.');
          return;
        }
  
        const response = await axios.post('http://localhost:5000/api/classes/schedule', 
          { occurrence_id: selectedEvent.occurrence.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        if (response.data.success) {
          setIsDialogOpen(false);
          setConfirmationMessage(`You have successfully booked ${selectedEvent.title} at ${selectedEvent.start.toLocaleTimeString()}`);
          setShowConfirmation(true);
  
          // Update the local state with the new capacity
          const updatedEvents = events.map(event => {
            if (event.id === selectedEvent.occurrence.id) {
              return {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  occurrence: {
                    ...event.extendedProps.occurrence,
                    current_capacity: response.data.current_capacity
                  }
                }
              };
            }
            return event;
          });
          setEvents(updatedEvents);
  
          // Update the selectedEvent with the new capacity
          setSelectedEvent(prevState => ({
            ...prevState,
            occurrence: {
              ...prevState.occurrence,
              current_capacity: response.data.current_capacity
            }
          }));
  
          // Optionally, you can refresh the entire events list here
          // fetchEvents();
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error('Error scheduling class:', error);
        setError(error.response?.data?.message || 'Failed to schedule class. Please try again.');
      }
    }
  };

  console.log('Rendering calendar with events:', events);

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
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        events={events}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => {
          const [time, instructor, className] = eventInfo.event.title.split('\n');
          return (
            <div className="event-content">
              <div className="event-time">{time}</div>
              <div className="event-instructor">{instructor}</div>
              <div className="event-class-name">{className}</div>
            </div>
          );
        }}
        eventClassNames="fc-event"
      />
      {showConfirmation && (
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={true}
          autoHideDuration={6000}
          onClose={() => setShowConfirmation(false)}
        >
          <Alert onClose={() => setShowConfirmation(false)} severity="success">
            {confirmationMessage}
          </Alert>
        </Snackbar>
      )}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Schedule Class</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to schedule {selectedEvent?.title} at {selectedEvent?.start.toLocaleTimeString()}?
          </Typography>
          <Typography>
            Current capacity: {selectedEvent?.occurrence.current_capacity} / {selectedEvent?.occurrence.max_capacity}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleClass} color="primary">Schedule</Button>
        </DialogActions>
      </Dialog>
      {error && (
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={true}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default Calendar;
