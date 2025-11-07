import api from "./api";

export const getDashboard=()=> api.get("/admin/dashboard");
export const getPendingDeclarations=(page=1,limit=20)=>
    api.get(`/admin/declarations/pending?page=${page}&limit=${limit}`);

// validation Declaration
export const validateDeclaration=(id)=>
    api.patch(`/admin/declarations/${id}/validate`);

///voir payment
export const getPayments=(page=1,limit=50)=>
    api.get(`/admin/payments?page=${page}&limit=${limit}`);

/// confirmation de payment

export const confirmPayment=(id)=>
    api.patch(`/admin/payments/${id}/confirm`);

export const getUsers=(params={})=>
    api.get("/admin/users",{params});