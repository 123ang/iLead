import React from "react";

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost:
      "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-uum-blue disabled:text-slate-400",
  };

  return (
    <button className={`${variants[variant] || variants.primary} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
