import { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { requestLoginOTP, verifyOTP } from "../services/authServices";

export default function Login(){
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState(1); // 1 phone -> 2 otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!phone) return Swal.fire("Erreur", "Entrez le numéro de téléphone", "error");
    setLoading(true);
    try {
      const res = await requestLoginOTP(phone);
      const debugOtp = res.data?.data?.debug?.otpCode || res.data?.data?.otpCode;
      // backend returns userId in data per your authController
      const userIdResp = res.data?.data?.userId || res.data?.data?.user?.id;
      setUserId(userIdResp);
      setStep(2);
      Swal.fire("Code envoyé", process.env.NODE_ENV === 'development' && debugOtp ? `OTP debug: ${debugOtp}` : "Un code a été envoyé par SMS", "success");
    } catch (err) {
      Swal.fire("Erreur", err?.response?.data?.message || "Impossible d'envoyer le code", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (!otp || !userId) return Swal.fire("Erreur","OTP requis","error");
    setLoading(true);
    try {
      const res = await verifyOTP({ userId, otpCode: otp });
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      loginWithToken(token, user);
      Swal.fire("Bienvenue", "Connexion réussie", "success");
    } catch (err) {
      Swal.fire("Erreur", err?.response?.data?.message || "Code invalide", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-primary-600 mb-6">Connexion Agent / Admin</h2>

        {step === 1 && (
          <form onSubmit={sendOTP} className="space-y-4">
            <input type="text" placeholder="Numéro de téléphone" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full p-3 border rounded" />
            <button disabled={loading} className="w-full bg-primary-600 text-white py-3 rounded">{loading ? "Envoi..." : "Recevoir le code"}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitOTP} className="space-y-4">
            <div className="text-sm text-gray-600">Code envoyé au {phone}</div>
            <input type="text" placeholder="Entrez le code OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} className="w-full p-3 border rounded" />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-primary-600 text-white py-3 rounded">{loading ? "Vérification..." : "Vérifier le code"}</button>
              <button type="button" onClick={()=>setStep(1)} className="flex-1 border rounded py-3">Revenir</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
