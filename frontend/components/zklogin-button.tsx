"use client";

type Props = {
  onSuccess: (address?: string) => void;
};

export function ZkLoginButton({ onSuccess }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSuccess()}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
    >
      Continue with zkLogin (mock)
    </button>
  );
}
