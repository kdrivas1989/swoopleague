"use client";

import { useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#00d4ff",
  },
};

interface CheckoutFormProps {
  onSuccess: (registrationId: number) => void;
  registrationId: number;
}

function CheckoutForm({ onSuccess, registrationId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Validation failed");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/events/confirmation?registration=${registrationId}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setProcessing(false);
      return;
    }

    onSuccess(registrationId);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full rounded-lg bg-accent-cyan px-6 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

interface PaymentFormProps {
  clientSecret: string;
  registrationId: number;
  onSuccess: (registrationId: number) => void;
}

export default function PaymentForm({
  clientSecret,
  registrationId,
  onSuccess,
}: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm onSuccess={onSuccess} registrationId={registrationId} />
    </Elements>
  );
}
