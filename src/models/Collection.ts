import axios from 'axios';
// import { User, IUserProps } from './User';
import { Eventing } from './Eventing';

export class Collection<T, K> {
    models: T[] = [];
    events: Eventing = new Eventing();

    constructor(public baseUrl: string, public deserialize: (json: K) => T) {}

    get on() {
        return this.events.on;
    }

    get trigger() {
        return this.events.trigger;
    }

    async fetch(): Promise<void> {
        try {
            const resp = await axios.get(this.baseUrl);
            resp.data.forEach((el: K) => {
                this.models.push(this.deserialize(el));
            });
            this.trigger('onchange');
        } catch (error) {
            throw new Error('Error fetching collection');
        }
    }
}
