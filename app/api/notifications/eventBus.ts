import { EventEmitter } from "events";

export type ViolationEventPayload = {
  vehicleId: string;
  notification: {
    _id: string;
    number_plate: string;
    violation_type: string;
    cause: string;
    camera_location: string;
    message: string;
    createdAt: string;
  };
};

const globalWithBus = globalThis as typeof globalThis & {
  _notificationEventBus?: EventEmitter;
};

const eventBus = globalWithBus._notificationEventBus || new EventEmitter();

if (!globalWithBus._notificationEventBus) {
  eventBus.setMaxListeners(100);
  globalWithBus._notificationEventBus = eventBus;
}

export { eventBus };
