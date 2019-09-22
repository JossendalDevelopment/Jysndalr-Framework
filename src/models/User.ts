import { Model } from './Model';
import { Attributes } from './Attributes';
import { ApiSync } from './Sync';
import { Eventing } from './Eventing';
import { Collection } from './Collection';

export interface IUserProps {
    id?: number;
    name?: string;
    age?: number;
    email?: string;
    role?: string;
}
const defaultUser: IUserProps = {
    id: undefined,
    name: '',
    age: undefined,
    email: '',
    role: 'user',
};

const BASE_URL = 'http://localhost:3000/users';

export class User extends Model<IUserProps> {
    static buildUser(attrs: IUserProps): User {
        return new User(
            new Attributes<IUserProps>(attrs, defaultUser),
            new Eventing(),
            new ApiSync<IUserProps>(BASE_URL)
        );
    }

    static buildUserCollection(): Collection<User, IUserProps> {
        return new Collection<User, IUserProps>(BASE_URL, (json: IUserProps) =>
            User.buildUser(json)
        );
    }

    isAdmin = (): boolean => {
        return this.get('role') === 'admin';
    };

    setRandomAge = (): void => {
        console.log('SET RANDOM AGE CALLED');
        const age = Math.round(Math.random() * 100);
        this.set({ age });
    };
}
