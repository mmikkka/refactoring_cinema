import React, { useState } from "react";
import { httpClient } from "../api/http";

interface PaymentFormProps {
  purchaseId: number;
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ purchaseId, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState("");

  const handlePay = async () => {
    if (!cardNumber) return alert("Введите номер карты");
    try {
      await httpClient.post(
        "/payments/process",
        {
          purchaseId,
          cardNumber,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Оплата прошла успешно!");
      onSuccess();
    } catch (err) {
      alert("Ошибка при оплате");
    }
  };

  return (
    <div className="bg-secondary p-4 rounded mt-4">
      <h5 className="text-white">Оплата брони №{purchaseId}</h5>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Номер карты"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
        <button className="btn btn-success" onClick={handlePay}>
          Оплатить
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
