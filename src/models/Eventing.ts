export type Callback = () => void;

export class Eventing {
    events: { [key: string]: Callback[] } = {};

    on = (eventName: string, cb: Callback): void => {
        const handlers = this.events[eventName] || [];
        handlers.push(cb);
        this.events[eventName] = handlers;
    };

    trigger = (eventName: string): void => {
        const handlers = this.events[eventName];
        if (!handlers || handlers.length === 0) {
            console.log(`Listener '${eventName}' does not exist.`);
            // throw new Error(`Listener '${eventName}' does not exist.`);
        }

        handlers.forEach(callback => callback());
    };
}
