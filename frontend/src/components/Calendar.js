// Calendar.js

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import moment from 'moment';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Snackbar,
  Alert,
  Button,
} from '@mui/material';
import axios from 'axios';
import './CalendarStyles.css';

const Calendar = ({ classes, selectedClass }) => {
  const [events, setEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentViewStart, setCurrentViewStart] = useState(moment().startOf('week'));
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleDatesSet = (dateInfo) => {
    setCurrentViewStart(moment(dateInfo.start));
  };

  const classColors = {};

  useEffect(() => {
    if (classes === undefined) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      if (Array.isArray(classes) && classes.length > 0) {
        const newEvents = generateEvents(classes, selectedClass, currentViewStart);
        setEvents(newEvents);
      } else {
        console.warn('Classes is empty or not an array:', classes);
        setEvents([]);
      }
    }
  }, [classes, selectedClass, currentViewStart]);

  const getClassColor = (className) => {
    if (!classColors[className]) {
      // Generate a random color
      const randomColor = getRandomColor();
      classColors[className] = randomColor;
    }
    return classColors[className];
  };

  const getRandomColor = () => {
    // Generate a random hex color code
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const getEventDates = (classItem, occurrence, viewStart) => {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(occurrence.day.toLowerCase());
    const [hours, minutes] = occurrence.time.split(':').map(Number);
    const start = moment(viewStart).startOf('week').add(dayIndex, 'days').set({
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
    });
    const end = moment(start).add(1, 'hour');

    return {
      start: start.toDate(),
      end: end.toDate(),
      id: classItem.id,
      title: `${occurrence.time}\n${classItem.instructor}\n${classItem.name}`,
      occurrenceId: occurrence.id,
      occurrence: { ...occurrence, class_name: classItem.name },
      color: getClassColor(classItem.name),
      extendedProps: {
        occurrence,
        classItem: { ...classItem, name: classItem.name },
      },
    };
  };

  const generateEvents = (classes, selectedClass, viewStart) => {
    if (!classes || !Array.isArray(classes)) {
      console.error('Classes is not an array:', classes);
      return [];
    }

    return classes.flatMap((classItem) => {
      if (!classItem || typeof classItem !== 'object') {
        console.error('Invalid class item:', classItem);
        return [];
      }

      if (selectedClass && classItem.name !== selectedClass) {
        return [];
      }

      if (!classItem.occurrences || !Array.isArray(classItem.occurrences)) {
        console.warn(
          `Class "${classItem.name}" has no occurrences or occurrences is not an array:`,
          classItem
        );
        return [];
      }

      return classItem.occurrences.map((occurrence) => {
        const { start, end } = getEventDates(classItem, occurrence, viewStart);

        return {
          title: classItem.name,
          start,
          end,
          id: occurrence.id,
          allDay: false,
          extendedProps: {
            occurrence,
            classItem,
            time: occurrence.time,
            instructor: classItem.instructor || 'No instructor',
            instructorPhoto: classItem.instructorPhoto || '', // Assuming instructorPhoto is available
          },
          color: getClassColor(classItem.name),
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
      maxCapacity: occurrence.max_capacity,
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
        const response = await axios.post(
          'http://localhost:5000/api/classes/schedule',
          { occurrence_id: selectedEvent.occurrence.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setIsDialogOpen(false);
          setConfirmationMessage(
            `You have successfully booked ${selectedEvent.classItem.name} at ${moment(
              selectedEvent.start
            ).format('h:mm A')}`
          );
          setShowConfirmation(true);
          const updatedEvents = events.map((event) => {
            if (event.id === selectedEvent.occurrence.id) {
              return {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  occurrence: {
                    ...event.extendedProps.occurrence,
                    current_capacity: response.data.current_capacity,
                  },
                },
              };
            }
            return event;
          });
          setEvents(updatedEvents);
          setSelectedEvent((prevState) => ({
            ...prevState,
            occurrence: {
              ...prevState.occurrence,
              current_capacity: response.data.current_capacity,
            },
          }));
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error('Error scheduling class:', error);
        setError(
          error.response?.data?.message ||
            'Failed to schedule class. Please try again.'
        );
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        datesSet={handleDatesSet}
        events={events}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => {
          const { time, instructor, classItem, instructorPhoto } = eventInfo.event.extendedProps;

          return (
            <div className="event-content">
              <div className="event-time">
                {moment(eventInfo.event.start).format('h:mm A')}
              </div>
              <div className="event-class-name">{classItem.name}</div>
              <div className="event-instructor">
                {instructorPhoto && (
                  <img
                    src={instructorPhoto}
                    alt={instructor}
                    className="instructor-photo"
                  />
                )}
                {instructor}
              </div>
            </div>
          );
        }}
        eventClassNames="fc-event"
        eventDidMount={(info) => {
          // Set event background color based on class type
          info.el.style.setProperty('--event-bg-color', info.event.backgroundColor);
        }}
        height="auto"
      />
      {showConfirmation && (
        <Snackbar
          open={showConfirmation}
          autoHideDuration={6000}
          onClose={() => setShowConfirmation(false)}
        >
          <Alert
            onClose={() => setShowConfirmation(false)}
            severity="success"
          >
            {confirmationMessage}
          </Alert>
        </Snackbar>
      )}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Schedule Class</DialogTitle>
        <DialogContent className="dialog-content">
          {selectedEvent && (
            <>
              <Typography className="dialog-question">
                Would you like to schedule the {selectedEvent.classItem.name} class
                with {selectedEvent.classItem.instructor} on {moment(selectedEvent.start).format('dddd, MMMM D')} at {moment(selectedEvent.start).format('h:mm A')}?
              </Typography>
              <Typography className="available-spots">
                Available spots: {selectedEvent.maxCapacity - selectedEvent.currentCapacity} out of {selectedEvent.maxCapacity}
              </Typography>
              <div className="dialog-actions">
                <Button onClick={() => setIsDialogOpen(false)} className="dialog-button">Cancel</Button>
                <Button onClick={handleScheduleClass} className="dialog-button">Schedule</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {error && (
        <Snackbar
          open={!!error}
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
