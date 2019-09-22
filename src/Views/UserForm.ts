import { User, IUserProps } from '../models/User';
import { View } from './View';

export class UserForm extends View<User, IUserProps> {
    eventsMap(): { [key: string]: (event: any) => void } {
        return {
            'click:.save': this.onSaveClick,
            'click:.random': this.onSetAgeClick,
            'input:input': this.onChange,
            'drag:div': this.onDrag,
        };
    }

    onSaveClick = (e: Event): void => {
        e.preventDefault();
        const nameInput = <HTMLInputElement>(
            this.parent.querySelector(`input[name='name']`)
        );
        const emailInput = <HTMLInputElement>(
            this.parent.querySelector(`input[name='email']`)
        );
        if (nameInput && emailInput) {
            const name = nameInput.value;
            const email = emailInput.value;

            console.log('EMAIL', emailInput);
            this.model.set({ email, name });

            this.model.save();
        } else {
            throw new Error('Missing required fields');
        }
    };

    onSetAgeClick = (e: Event): void => {
        e.preventDefault();
        this.model.setRandomAge();
    };

    onChange = (e: Event): void => {
        e.preventDefault();
        const target = e.target as HTMLInputElement;
        this.model.set({ [target.name]: target.value });
    };

    onDrag = (e: Event): void => {
        e.preventDefault();
        console.log('dragging', e);
    };

    template = (): string => {
        return `
			<div class="container" draggable="true">
				<label for="name">Name</label>
				<input class="input" placeholder="Enter Name" name="name" type="text" value="${this.model.get(
                    'name'
                )}" />
				<label for="email">Email</label>
				<input class="input" placeholder="Enter Email" name="email" type="text" value="${this.model.get(
                    'email'
                )}" />
				<label for="age">Age</label>
				<input class="input" placeholder="Enter Age" name="age" type="text" value="${this.model.get(
                    'age'
                )}" />
				<button class="btn btn-primary save">Save</button>
				<button class="btn btn-secondary random">Set Random Age</button>
            </div>
        `;
    };
}
