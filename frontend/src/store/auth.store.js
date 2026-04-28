import { create } from 'zustand';
export const useAuthStore = create((set)=>({ accessToken:null, user:null, setSession:(s)=>set({accessToken:s.accessToken,user:s.user}), logout:()=>set({accessToken:null,user:null}) }));
