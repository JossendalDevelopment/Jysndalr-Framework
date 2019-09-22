import { UserForm } from './Views/UserForm';
import { User } from './models/User';

const user = User.buildUser({
    id: 11,
    name: 'Biff Tannen',
    age: 2019,
    email: 'biffmail@mail.com',
});

const root = document.getElementById('app');
if (root) {
    const userForm = new UserForm(root, user);
    userForm.render();
} else {
    throw new Error('Root element not found');
}
