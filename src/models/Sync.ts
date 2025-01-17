import axios, { AxiosResponse, AxiosPromise } from 'axios';

interface IHasId {
    id?: number;
}

export class ApiSync<T extends IHasId> {
    constructor(public baseUrl: string) {}

    fetch = (id: number): AxiosPromise => {
        return axios.get(`${this.baseUrl}/${id}`);
    };

    save = (data: T): AxiosPromise => {
        const { id } = data;
        if (id) {
            return axios.put(`${this.baseUrl}/${id}`, data);
        } else {
            return axios.post(this.baseUrl, data);
        }
    };
}
