"use client";

type Props = {
  onSuccess: (address?: string) => void;
};

export function ZkLoginButton({ onSuccess }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSuccess()}
      className="cta py-4 text-sm rounded-lg"
    >
      Initialize Link
    </button>
  );
}
