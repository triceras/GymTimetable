// src/components/Calendar.js

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import moment from 'moment';
import ClassDetails from './ClassDetails';
import './CalendarStyles.css';
import { useAuth } from '../contexts/AuthContext';

const Calendar = ({ classes }) => {
    const [open, setOpen] = useState(false);
    const [classData, setClassData] = useState({});
    const { isAuthenticated } = useAuth();

    const handleEventClick = (info) => {
        const { occurrence, classItem } = info.event.extendedProps;
        setClassData({
            ...info.event.extendedProps,
            classData: {
                id: classItem.id,
                name: classItem.name,
                current_capacity: classItem.current_capacity,
                max_capacity: classItem.max_capacity,
            },
        });
        setOpen(true);
    };


    const handleClose = () => {
        setOpen(false);
    };

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

    const events = classes.flatMap((classItem) => {
        return classItem.occurrences.map((occurrence) => {
            const { start, end } = getEventDates(classItem, occurrence, classItem.classData);
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

    const handleEventMouseEnter = (info) => {
        const eventEl = info.el;
        eventEl.style.zIndex = 1;
        eventEl.style.transform = 'scale(1.1)';
    };

    const handleEventMouseLeave = (info) => {
        const eventEl = info.el;
        eventEl.style.zIndex = '';
        eventEl.style.transform = '';
    };

    const handleEventDidMount = (info) => {
        const eventEl = info.el;
        eventEl.style.zIndex = '';
        eventEl.style.transform = '';
    };

    return ( <
        >
        <
        FullCalendar plugins = {
            [dayGridPlugin, interactionPlugin, timeGridPlugin]
        }
        initialView = "timeGridWeek"
        headerToolbar = {
            {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }
        }
        buttonText = {
            {
                today: 'today',
                month: 'month',
                week: 'week',
                day: 'day',
            }
        }
        slotMinTime = "06:00:00"
        slotMaxTime = "22:00:00"
        events = { events }
        eventClick = { handleEventClick }
        eventMouseEnter = { handleEventMouseEnter }
        eventMouseLeave = { handleEventMouseLeave }
        eventDidMount = { handleEventDidMount }
        /> <
        ClassDetails open = { open }
        classData = { classData }
        onClose = { handleClose }
        onClassUpdated = { handleClose }
        isAuthenticated = { isAuthenticated }
        />  < /
        >
    );
};

export default Calendar;
