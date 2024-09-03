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

  useEffect(() => {
    if (classes && classes.length > 0) {
      const newEvents = generateEvents(classes, selectedClass);
      setEvents(newEvents);
    }
  }, [classes, selectedClass]);

  const getClassColor = (classId) => {
    const colors = ['#F79C1E', '#1E90F7', '#F71E45', '#45F71E', '#1EF7DC'];
    return colors[classId % colors.length];
  };

  const getEventDates = (classItem, occurrence) => {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(occurrence.day.toLowerCase());
    const startTime = moment.duration(occurrence.time);
    const start = moment().startOf('week').add(dayIndex, 'days').add(startTime);
    const end = start.clone().add(1, 'hours').toDate();

    return {
      start: start.toDate(),
      end,
      id: classItem.id,
      title: classItem.name,
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
          title: classItem.name,
          start,
          end,
          id: occurrence.id,
          allDay: false,
          extendedProps: {
            occurrence,
            classItem,
            classData: classItem.classData,
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
        const response = await axios.post('http://localhost:5000/api/classes/schedule', {
          occurrence_id: selectedEvent.occurrence.id
        });
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
          setSelectedEvent({
            ...selectedEvent,
            occurrence: {
              ...selectedEvent.occurrence,
              current_capacity: response.data.current_capacity
            }
          });
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error('Error scheduling class:', error);
        setError('Failed to schedule class. Please try again.');
      }
    }
  };

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
