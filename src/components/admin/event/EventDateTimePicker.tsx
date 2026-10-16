import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import type { DateOption } from "flatpickr/dist/types/options";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import "flatpickr/dist/flatpickr.min.css";

type EventDateTimePickerProps = {
  name?: string;
  value?: DateOption;
  minDate?: DateOption;
  maxDate?: DateOption;
  placeholder?: string;
  onChange: (value: string) => void;
};

function setInternalButtonTypes(instance: Instance) {
  instance.calendarContainer
    .querySelectorAll<HTMLButtonElement>("button")
    .forEach((button) => {
      button.type = "button";
    });
}

function stopCalendarClickAway(event: Event) {
  event.stopPropagation();
}

function bindCalendarEvents(instance: Instance) {
  const calendar = instance.calendarContainer;
  const eventNames = ["pointerdown", "mousedown", "click", "touchstart"];

  eventNames.forEach((eventName) => {
    calendar.addEventListener(eventName, stopCalendarClickAway);
  });

  return () => {
    eventNames.forEach((eventName) => {
      calendar.removeEventListener(eventName, stopCalendarClickAway);
    });
  };
}

export function EventDateTimePicker({
  name,
  value,
  minDate,
  maxDate,
  placeholder = "dd/mm/yyyy --:--",
  onChange,
}: EventDateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const instanceRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  const lastEmittedValueRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    const instance = flatpickr(inputRef.current, {
      enableTime: true,
      closeOnSelect: false,
      static: true,
      disableMobile: true,
      dateFormat: "d/m/Y H:i",
      time_24hr: true,
      minuteIncrement: 15,
      locale: Vietnamese,
      defaultDate: value,
      minDate,
      maxDate,
      onReady: (_selectedDates, _dateString, pickerInstance) => {
        setInternalButtonTypes(pickerInstance);
      },
      onOpen: (_selectedDates, _dateString, pickerInstance) => {
        setInternalButtonTypes(pickerInstance);
      },
      onChange: ([date]) => {
        if (!date) return;

        const nextValue = date.toISOString();
        lastEmittedValueRef.current = nextValue;
        onChangeRef.current(nextValue);
      },
    });

    instanceRef.current = instance;
    const cleanupCalendarEvents = bindCalendarEvents(instance);

    return () => {
      cleanupCalendarEvents();
      instance.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    instance.set("minDate", minDate);
    instance.set("maxDate", maxDate);
  }, [minDate, maxDate]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    if (!value) {
      if (instance.selectedDates.length) instance.clear(false);
      return;
    }

    if (value === lastEmittedValueRef.current) return;

    const currentValue = instance.selectedDates[0]?.toISOString();
    if (currentValue !== value) {
      instance.setDate(value, false);
    }
  }, [value]);

  return (
    <input
      name={name}
      ref={inputRef}
      className="date-input event-datetime-input"
      placeholder={placeholder}
    />
  );
}
