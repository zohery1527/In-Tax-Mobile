import api from "./api";

export const requestLoginOTP=(phoneNumber)=>
  api.post("/auth/login",{phoneNumber});

export const verifyOTP=(payload)=>
  api.post("/auth/verify-otp",payload);

export const registerUser=(payload)=>
  api.post("/auth/register",payload);

export const getProfile=()=> api.get("/auth/profile");



