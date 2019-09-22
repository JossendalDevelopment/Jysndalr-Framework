import { Callback } from './Eventing';
import { AxiosPromise } from 'axios';

interface ModelAttributes<T> {
    set(update: T): void;
    getAll(): T;
    get<K extends keyof T>(key: K): T[K];
}

interface Sync<T> {
    fetch(id: number): AxiosPromise;
    save(data: T): AxiosPromise;
}

interface Events {
    on(eventName: string, cb: Callback): void;
    trigger(eventName: string): void;
}

interface IHasId {
    id?: number;
}

export class Model<T extends IHasId> {
    constructor(
        private attributes: ModelAttributes<T>,
        private events: Events,
        private sync: Sync<T>
    ) {}

    // on = this.events.on;
    // trigger = this.events.trigger;
    // get = this.attributes.get;
    get on() {
        return this.events.on;
    }

    get trigger() {
        return this.events.trigger;
    }

    get get() {
        return this.attributes.get;
    }

    set = (update: T): void => {
        this.attributes.set(update);
        this.events.trigger('re-render');
    };

    fetch = async (): Promise<void> => {
        const id = this.get('id');
        if (!id) {
            throw new Error('id required');
        } else {
            try {
                const resp = await this.sync.fetch(id as number);
                this.set(resp.data);
            } catch (error) {
                throw new Error('Error fetching data');
            }
        }
    };

    save = async (): Promise<void> => {
        try {
            const user = this.attributes.getAll();
            this.sync.save(user);
            // this.trigger('onsave');
        } catch (error) {
            throw new Error('Error saving data');
        }
    };
}
