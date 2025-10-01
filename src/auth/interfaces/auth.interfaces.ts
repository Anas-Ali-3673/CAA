import { IUser,  } from "src/users/interfaces/users.interface";

export interface IAuth extends Omit<IUser,"password">{
    accessToken:string;
}

export interface ISignUp extends Omit<IUser,"password"> {
    accessToken:string;
}